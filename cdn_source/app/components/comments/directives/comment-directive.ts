module MyApp.Components.Comments {
    interface ICommentScope extends ICommentSectionScope {
        newComment: { replyTo?; message: string; open: boolean };
        comment: AbstractDefs.IBreezeComment;
        edit: { editing: number;showComments: boolean };
        actionsEnabled;
        userAvatar;
        canEdit;
    }

    class CommentDirective extends Tk.Directive {
        static $name = 'sxComment';
        static $inject = ['RecursionHelper', 'w6'];
        static factory = getFactory(CommentDirective.$inject, (recursionHelper, w6) => new CommentDirective(recursionHelper, w6));

        constructor(private recursionHelper, private w6: W6) {
            super();
        }

        templateUrl = CommentSectionDirectiveController.viewBase + '/comment.html';
        restrict = 'E';
        scope = true;
        internalLink = ($scope: ICommentScope) => {
            $scope.newComment = {
                replyTo: $scope.comment,
                message: "",
                open: false
            };
            $scope.edit = { editing: 0, showComments: $scope.comment.hasReply() };
            $scope.actionsEnabled = !$scope.comment.archivedAt || $scope.canManage;
            $scope.userAvatar = $scope.comment.authorId == this.w6.userInfo.id ? this.w6.userInfo.getAvatarUrl(72) : $scope.comment.author.getAvatarUrl(72);
            $scope.canEdit = $scope.canManage || this.w6.userInfo.id == $scope.comment.authorId;
            $scope.level += 1;

            $scope.$on('closeComment', () => $scope.newComment.open = false);
        }; // Use the compile function from the RecursionHelper,
        compile = element => this.recursionHelper.compile(element, this.internalLink); // And return the linking function(s) which it returns
    }

    interface ICommentSectionScope extends ng.IScope {
        w6: W6;
        url: W6Urls;
        level: number;
        closeComments: () => any;
        openLoginDialog: () => any;
        selfAvatar;
        newComment: { open: boolean;message: string };
        editComment: (comment, model) => any;
        canManage: boolean;
        cancelCommentInternal: (scope) => void;
        addCommentInternal: (scope) => void;
    }

    class CommentSectionDirectiveController {
        static $inject = ['$scope', '$element', '$attrs', '$transclude', '$rootScope'];
        static viewBase = '/cdn_source/app/components/comments';

        constructor($scope: ICommentSectionScope, $element, $attrs, $transclude, $rootScope: IRootScope) {
            $scope.url = $rootScope.url;
            $scope.w6 = $rootScope.w6;
            $scope.editComment = (comment, model) => model.editing = model.editing + 1;
            $scope.newComment = { open: true, message: "" };
            $scope.selfAvatar = $rootScope.w6.userInfo.getAvatarUrl(72);
            $scope.openLoginDialog = $rootScope.openLoginDialog;
            $scope.closeComments = () => $scope.$broadcast('closeComment');
            $scope.level = 0;
/*
            $scope.addCommentInternal = () => {
                $scope.addComment({ comment: $scope.newComment });
                $scope.closeComments();
            };
*/

            // WARNING: Workaround because of Scope issues - we loose the appropriate scope at different times.
            $scope.cancelCommentInternal = scope => {
                scope.newComment.message = '';
                scope.newComment.open = false;
            };
            $scope.addCommentInternal = scope => {
                scope.addComment({ comment: scope.newComment });
                //scope.closeComments();
                $scope.closeComments();
                scope.newComment.open = false; // Workaround
                if (scope.edit)
                    scope.edit.showComments = true;
            };
        }
    }

    class CommentSectionDirective extends Tk.Directive {
        static $name = 'sxComments';
        static $inject = [];
        static factory = getFactory(CommentSectionDirective.$inject, () => new CommentSectionDirective());

        controller = CommentSectionDirectiveController;
        templateUrl = CommentSectionDirectiveController.viewBase + '/index.html';
        transclude = true;
        restrict = 'E';
        scope = {
            comments: '=',
            canManage: '=',
            addComment: '&',
            deleteComment: '&',
            saveComment: '&',
            reportComment: '&',
            likeComment: '&',
            unlikeComment: '&',
            likeStates: '='
        };
    }

    angular.module('Components.Comments', [])
        .directive(CommentDirective.$name, CommentDirective.factory)
        .directive(CommentSectionDirective.$name, CommentSectionDirective.factory);
}
