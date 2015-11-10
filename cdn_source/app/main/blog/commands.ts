module MyApp.Main.Blog {
    export class GetBlogsQuery extends DbQueryBase {
        static $name = "GetBlogsQuery";
        public execute = [
            'team', team => this.context.executeQuery(breeze.EntityQuery.from("Posts")
                .where("category", breeze.FilterQueryOp.Equals, team ? "Team" : "General")
                .orderByDesc("created")
                .top(12)
                .select(["slug", "title", "summary", "author", "commentsCount", "created", "isPublished", "updated"]))
            .then(r => r.results)
        ];
    }

    registerCQ(GetBlogsQuery);

    export class GetBlogArchiveQuery extends DbQueryBase {
        static $name = "GetBlogArchiveQuery";
        public execute = [
            'team', 'year', 'month', (team, year, month) => this.context.executeQuery(breeze.EntityQuery.from("Posts")
                .where(
                    breeze.Predicate.create("category", breeze.FilterQueryOp.Equals, team ? "Team" : "General")
                    .and(breeze.Predicate.create("created", breeze.FilterQueryOp.LessThanOrEqual, new Date(Date.UTC(year, month - 1, 31)))
                        .and(breeze.Predicate.create("created", breeze.FilterQueryOp.GreaterThanOrEqual, new Date(Date.UTC(year, month - 1, 1))))))
                .orderByDesc("created")
                .top(12)
                .select(["slug", "title", "summary", "author", "commentsCount", "created", "isPublished", "updated"]))
            .then(r => r.results)
        ];
    }

    registerCQ(GetBlogArchiveQuery);

    export class GetBlogQuery extends DbQueryBase {
        static $name = "GetBlogQuery";
        public execute = ['slug', slug => this.findBySlug("posts", slug, 'getPost')];
    }

    registerCQ(GetBlogQuery);

    export class GetBlogArchiveSideQuery extends DbQueryBase {
        static $name = "GetBlogArchiveSideQuery";
        public execute = [
            'team', team => this.context.getCustom('blog/postmonths', {
                params: {
                    category: team ? 'Team' : 'General'
                },
                requestName: 'getPostArchive'
            })
            .then(result => result.data)
        ];
    }

    registerCQ(GetBlogArchiveSideQuery);

    enum BlogCategory {
        General,
        Team
    }

    export class GetBlogRecentQuery extends DbQueryBase {
        static $name = "GetBlogRecentQuery";
        public execute = [
            'team', team => this.context.executeQuery(breeze.EntityQuery.from("posts")
                .where("category", breeze.FilterQueryOp.Equals, team ? "Team" : "General")
                .orderByDesc("created")
                .top(5)
                .select(["id", "slug", "title"]), 'getRecentPosts')
            .then(result => result.results)
        ];
    }

    registerCQ(GetBlogRecentQuery);

    export class GetPostCommentsQuery extends DbQueryBase {
        static $name = 'GetPostComments';

        public execute = [
            'postId',
            postId => {
                Debug.log("getting postcomments by id: " + postId.toString());
                var query = breeze.EntityQuery.from("PostComments")
                    .where("postId", breeze.FilterQueryOp.Equals, postId)
                    .orderByDesc("created");
                return this.context.executeQuery(query)
                    .then((result) => result);
            }
        ];
    }

    registerCQ(GetPostCommentsQuery);

    export class CreatePostCommentCommand extends DbCommandBase {
        static $name = 'CreatePostComment';

        public execute = [
            'model', model => {
                var entity = BreezeEntityGraph.PostComment.createEntity(this.context.manager, { postId: model.postId, authorId: this.context.userInfo.id, message: model.message, created: new Date(Date.now()), replyToId: model.replyToId });
                if (model.replyTo) model.replyTo.replies.push(entity); // weird, why is this not automatic since we set replyToId?
                return this.context.saveChanges(undefined, [entity]);
            }
        ];
    }

    registerCQ(CreatePostCommentCommand);

    export class DeletePostCommentCommand extends DbCommandBase {
        static $name = 'DeletePostComment';

        public execute = [
            'model', (model: IBreezePostComment) => {
                model.archivedAt = new Date(Date.now());
                return this.context.saveChanges(undefined, [model]);
            }
        ];
    }

    registerCQ(DeletePostCommentCommand);

    export class SavePostCommentCommand extends DbCommandBase {
        static $name = 'SavePostComment';

        public execute = [
            'model', (model: IBreezePostComment) => {
                //model.entityAspect.setDeleted();
                return this.context.saveChanges(undefined, [model]);
            }
        ];
    }

    registerCQ(SavePostCommentCommand);

    export class GetPostCommentLikeStateQuery extends DbQueryBase {
        static $name = 'GetPostCommentLikeState';
        public execute = ['postId', postId => this.context.getCustom('comments/posts/' + postId + "/states")];
    }

    registerCQ(GetPostCommentLikeStateQuery);

    export class LikePostCommentCommand extends DbCommandBase {
        static $name = 'LikePostCommentCommand';
        public execute = ['id', id => this.context.postCustom("comments/post/" + id + "/" + "like")];
    }

    registerCQ(LikePostCommentCommand);

    export class UnlikePostCommentCommand extends DbCommandBase {
        static $name = 'UnlikePostCommentCommand';
        public execute = ['id', id => this.context.postCustom("comments/post/" + id + "/" + "unlike")];
    }

    registerCQ(UnlikePostCommentCommand);


    export class GetPostLikeStateQuery extends DbQueryBase {
        static $name = 'GetPostLikeState';
        public execute = [() => this.context.getCustom('posts/states')];
    }

    registerCQ(GetPostLikeStateQuery);

    export class LikePostCommand extends DbCommandBase {
        static $name = 'LikePostCommand';
        public execute = ['id', id => this.context.postCustom("posts/" + id + "/" + "like")];
    }

    registerCQ(LikePostCommand);

    export class UnlikePostCommand extends DbCommandBase {
        static $name = 'UnlikePostCommand';
        public execute = ['id', id => this.context.postCustom("posts/" + id + "/" + "unlike")];
    }

    registerCQ(UnlikePostCommand);
}