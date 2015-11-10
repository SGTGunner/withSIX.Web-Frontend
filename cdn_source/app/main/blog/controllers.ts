module MyApp.Main.Blog {
    interface IBlogsScope extends IBaseScopeT<IBreezePost[]> {
        blogUrl: string;
        postArchive;
        recentPosts;
    }

    class BlogsController extends BaseQueryController<IBreezePost[]> {
        static $name = "BlogsController";
        static $inject = ['$scope', 'logger', '$q', 'model', 'postArchive', 'recentPosts'];

        constructor(public $scope: IBlogsScope, public logger, $q, model: IBreezePost[], postArchive, recentPosts) {
            super($scope, logger, $q, model);

            $scope.blogUrl = $scope.url.main + '/blog';
            $scope.postArchive = postArchive;
            $scope.recentPosts = recentPosts;
        }
    }

    registerController(BlogsController);

    interface IBlogsArchiveScope extends IBlogsScope {
        year;
        month;
    }

    class BlogArchiveController extends BlogsController {
        static $name = "BlogArchiveController";
        static $inject = ['$scope', 'logger', '$q', '$routeParams', 'model', 'postArchive', 'recentPosts'];

        constructor(public $scope: IBlogsArchiveScope, public logger, $q, $routeParams, model: IBreezePost[], postArchive, recentPosts) {
            super($scope, logger, $q, model, postArchive, recentPosts);

            $scope.year = $routeParams.year;
            $scope.month = $routeParams.month;
        }
    }

    registerController(BlogArchiveController);

    export interface IBlogPostScope extends IContentScope, IHandleCommentsScope<IBreezePostComment> {
        model;
        postArchive;
        recentPosts;
        blogUrl: string;
        postUrl: string;
        trustedContentHtml;
        likedPosts: {};
        like: () => any;
        unlike: () => any;
    }

    export interface IBlogPostContentModel extends IContentModel<IBreezePost> {
    }

    class BlogController extends BaseQueryController<IBreezePost> {
        static $name = "BlogController";
        static $inject = ['$scope', 'logger', '$q', '$timeout', 'post', 'postArchive', 'recentPosts', '$sce'];

        constructor(public $scope: IBlogPostScope, public logger, $q, private $timeout, post: IBreezePost, postArchive, recentPosts, $sce: ng.ISCEService) {
            super($scope, logger, $q, post);
            this.setupComments(post);

            $scope.blogUrl = $scope.url.main + '/blog';
            $scope.postUrl = $scope.blogUrl + '/' + post.slug;
            $scope.postArchive = postArchive;
            $scope.recentPosts = recentPosts;

            if (debug) {
                $(window).data("scope-" + post.slug, $scope);
                $(window).data("scope", $scope);
            }

            if ($scope.environment != Tk.Environment.Production)
                this.setupLikes();

            this.setupTitle("model.title", "{0} - Blog");
            $scope.setMicrodata({
                title: post.title,
                description: post.summary || 'No summary yet',
                image: $('<div>' + post.summary + '</div>').find('img:first').attr('src') || $('<div>' + post.content + '</div>').find('img:first').attr('src')
            });
        }

        setupComments(post: IBreezePost) {
            this.$scope.addComment = (newComment) => {
                this.$scope.request(CreatePostCommentCommand, {
                    model: {
                        replyTo: newComment.replyTo,
                        postId: this.$scope.model.id,
                        message: newComment.message,
                        replyToId: newComment.replyTo ? newComment.replyTo.id : undefined
                    }
                });
                newComment.message = "";
            };
            this.$scope.deleteComment = (comment) => this.$scope.request(DeletePostCommentCommand, { model: comment });
            this.$scope.saveComment = (comment) => this.$scope.request(SavePostCommentCommand, { model: comment });

            if (this.$scope.environment != Tk.Environment.Production) {
                this.$scope.commentLikeStates = {};
                if (this.$scope.w6.userInfo.id) {
                    this.$timeout(() => this.$scope.request(GetPostCommentLikeStateQuery, { postId: this.$scope.model.id })
                        .then(results => this.subscriptionQuerySucceeded(results.lastResult, this.$scope.commentLikeStates))
                        .catch(this.breezeQueryFailed));
                }

                this.$scope.likeComment = comment => {
                    this.$scope.request(LikePostCommentCommand, { postId: this.$scope.model.id, id: comment.id })
                        .then(() => {
                            comment.likesCount += 1;
                            this.$scope.commentLikeStates[comment.id] = true;
                        });
                };
                this.$scope.unlikeComment = comment => {
                    this.$scope.request(UnlikePostCommentCommand, { postId: this.$scope.model.id, id: comment.id }).then(() => {
                        comment.likesCount -= 1;
                        this.$scope.commentLikeStates[comment.id] = false;
                    });
                };
            }

            this.$timeout(() => this.$scope.request(GetPostCommentsQuery, { postId: this.$scope.model.id }));
        }

        setupLikes() {
            this.$scope.like = () => this.$scope.request(LikePostCommand, { id: this.$scope.model.id })
                .then(() => {
                    this.$scope.model.likesCount += 1;
                    this.$scope.likedPosts[this.$scope.model.id] = true;
                });
            this.$scope.unlike = () => this.$scope.request(UnlikePostCommand, { id: this.$scope.model.id })
                .then(() => {
                    this.$scope.model.likesCount -= 1;
                    delete this.$scope.likedPosts[this.$scope.model.id];
                });

            // TODO: Move to a BlogsController that is parent of current Blogs+BlogController
            this.$scope.likedPosts = {};
            if (this.$scope.w6.userInfo.id) {
                this.$timeout(() => this.$scope.request(GetPostLikeStateQuery)
                    .then(results => this.subscriptionQuerySucceeded(results.lastResult, this.$scope.likedPosts))
                    .catch(this.breezeQueryFailed));
            }
        }
    }

    registerController(BlogController);
}
