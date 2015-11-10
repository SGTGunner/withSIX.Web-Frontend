module MyApp.Components {

    export enum FileSize {
        B,
        KB,
        MB,
        GB,
        TB,
        PB,
        EB,
        ZB,
        YB
    }

    export interface IMicrodata {
        title: string;
        description: string;
        image?: string;
        keywords?: string;
        currentPage?: string;
    }

    export interface IPageInfo {
        title: string;
    }

    class DirectivesComponent extends Tk.Module {
        static $name = "DirectivesComponentModule";

        constructor() {
            super('Components.Directives', []);
            this.app // http://stackoverflow.com/questions/21249441/disable-nganimate-form-some-elements
                .directive('sxDisableAnimation', [
                    '$animate', ($animate) => {
                        return {
                            restrict: 'A',
                            link: ($scope, $element, $attrs) => $animate.enabled(false, $element)
                        };
                    }
                ])
                .factory('RecursionHelper', [
                    '$compile', $compile => {
                        return {
                            /**
                         * Manually compiles the element, fixing the recursion loop.
                         * @param element
                         * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
                         * @returns An object containing the linking functions.
                         */
                            compile: (element, link) => {
                                // Normalize the link parameter
                                if (angular.isFunction(link)) {
                                    link = { post: link };
                                }

                                // Break the recursion loop by removing the contents
                                var contents = element.contents().remove();
                                var compiledContents;
                                return {
                                    pre: (link && link.pre) ? link.pre : null,
                                    /**
                                 * Compiles and re-adds the contents
                                 */ post(scope, element) {
                                        // Compile the contents
                                        if (!compiledContents) {
                                            compiledContents = $compile(contents);
                                        }
                                        // Re-add the compiled contents to the element
                                        compiledContents(scope, clone => {
                                            element.append(clone);
                                        });

                                        // Call the post-linking function, if any
                                        if (link && link.post) {
                                            link.post.apply(null, arguments);
                                        }
                                    }
                                };
                            }
                        };
                    }
                ])
                .directive('sxContent', () => {
                    var msie = (<any>document).documentMode;
                    var propName = 'content',
                        name = 'content';
                    var normalized = "sxContent";
                    return {
                        priority: 99, // it needs to run after the attributes are interpolated
                        link: (scope, element, attr) => {
                            attr.$observe(normalized, value => {
/*
                                if (!value) {
                                    if (attrName === 'href') {
                                        attr.$set(name, null);
                                    }
                                    return;
                                }
*/

                                attr.$set(name, value);

                                // on IE, if "ng:src" directive declaration is used and "src" attribute doesn't exist
                                // then calling element.setAttribute('src', 'foo') doesn't do anything, so we need
                                // to set the property as well to achieve the desired effect.
                                // we use attr[attrName] value since $set can sanitize the url.
                                if (msie && propName) element.prop(propName, attr[name]);
                            });
                        }

                    };
                })
                .directive('sxMicrodata', () => {
                    return {
                        require: 'ngModel',
                        replace: true,
                        scope: {
                            twitterName: '@',
                            twitterSiteId: '@',
                            ogName: '@'
                        },
                        link: (scope, el, attrs, ngModel) => {

                        }
                    };
                }).
                directive('sxAdsense', [
                    '$window', '$compile', 'adsense', ($window, $compile, adsense) => {
                        return {
                            restrict: 'E',
                            template: "",
                            replace: true,
                            scope: {
                                slot: '&dataSlot',
                                width: '&dataWidth',
                                height: '&dataHeight',
                            },
                            link: (scope, element, iAttrs) => {
                                var adSenseTpl = '<div class="adlinks"><ins class="adsbygoogle" style="display:inline-block;width:' + iAttrs.width + 'px;height:' + iAttrs.height + 'px" data-ad-client="' + adsense.client + '" data-ad-slot="' + iAttrs.slot + '"></ins></div>';
                                element.html(angular.element($compile(adSenseTpl)(scope)));
                                if (!$window.adsbygoogle)
                                    $window.adsbygoogle = [];
                                try {
                                    $window.adsbygoogle.push({});
                                } catch (ex) {
                                }
                            }
                        };
                    }
                ]).
                directive('validFile', () => {
                    return {
                        require: 'ngModel',
                        link: (scope, el, attrs, ngModel: ng.INgModelController) => {
                            el.bind('change', () => {
                                scope.$apply(() => {
                                    ngModel.$setViewValue(el.val());
                                    ngModel.$render();
                                });
                            });
                        }
                    };
                }).
                directive('sxInitScope', () => {
                    return {
                        scope: true,
                        priority: 450,
                        compile: () => {
                            return {
                                pre: (scope, element, attrs) => {
                                    var attr = <any>attrs;
                                    scope.$eval(attr.sxInitScope);
                                }
                            };
                        }
                    };
                }).
                directive('sxSpoiler', () => {
                    return {
                        scope: {

                        },
                        restrict: 'E',
                        transclude: true,
                        templateUrl: '/cdn_source/app/components/spoiler.html',
                        link: ($scope, $element, $attrs, controller) => {
                            $scope['shown'] = false;
                            $scope['toggle'] = () => {
                                $scope['shown'] = !$scope['shown'];
                            };
                        }
                    };
                }).
                directive('sxCompile', [
                    '$compile', $compile => (scope, element, attrs) => {
                        scope.$watch(
                            scope => scope.$eval(attrs.sxCompile),
                            value => {
                                // when the 'compile' expression changes
                                // assign it into the current DOM
                                element.html(value);

                                // compile the new DOM and link it to the current
                                // scope.
                                // NOTE: we only compile .childNodes so that
                                // we don't get into infinite loop compiling ourselves
                                $compile(element.contents())(scope);
                            }
                        );
                    }
                ]).
                directive('sxContentHeader', () => {
                    return {
                        restrict: 'A',
                        transclude: true,
                        templateUrl: '/cdn_source/app/play/shared/_content-header-new.html'
                    };
                }).
                directive('sxEditListItem', () => {
                    return {
                        restrict: 'EA',
                        transclude: true,
                        templateUrl: '/cdn_source/app/play/shared/_edit-list-item.html'
                    };
                }).
                directive('sxEditListItemNoModify', () => {
                    return {
                        restrict: 'EA',
                        transclude: true,
                        templateUrl: '/cdn_source/app/play/shared/_edit-list-item-no-modify.html'
                    };
                }).
                directive('sxInfoPage', () => {
                    return {
                        restrict: 'E',
                        transclude: true,
                        templateUrl: '/cdn_source/app/play/shared/_info-page.html'
                    };
                }).
                directive('sxMultiTransclude', () => {
                    return {
                        controller: MultiTranscludeDirectiveController,

                        link: ($scope, $element, $attrs, controller: MultiTranscludeDirectiveController) => {
                            var attrs = <any> $attrs;
                            var selector = '[name=' + attrs.sxMultiTransclude + ']';
                            var attach = clone => {
                                var $part = clone.find(selector).addBack(selector);
                                if ($part.length != 0) {
                                    $element.html('');
                                    $element.append($part);
                                }
                            };

                            if (controller.$transclude.$$element) {
                                attach(controller.$transclude.$$element);
                            } else {
                                controller.$transclude(clone => {
                                    controller.$transclude.$$element = clone;
                                    attach(clone);
                                });
                            }
                        }
                    };
                }).directive("sxLateTemplate", [
                    '$templateCache', '$compile', '$timeout', '$parse', '$http', '$q', ($templateCache, $compile, $timeout, $parse, $http: ng.IHttpService, $q: ng.IQService) => {
                      function getTemplate(keyOrUrl: string) {
                        var data = $templateCache.get(keyOrUrl);

                        if (data) {
                            return $q.when(data);
                        } else {
                            var deferred = $q.defer();

                            $http.get(keyOrUrl, { cache: true }).success(function (html) {
                                $templateCache.put(keyOrUrl, html);

                                deferred.resolve(html);
                            });

                            return deferred.promise;
                        }
                      }
                        return {
                            scope: {
                                template: '='
                            },
                            restrict: 'A',
                            link: (scope, element, attrs) => {
                                $timeout(() => {
                                  getTemplate(scope.template).then(x => {
                                    var content = $compile(x)(scope.$parent);
                                    element.append(content);
                                  });
                                });

                            }
                        };
                    }
                ]).
                directive('sxTime', () => {
                    return {
                        restrict: 'E',
                        template: ($element, $attrs) => {
                            // disabled raw date time display for now.
                            // TODO: Convert to proper .html template
                            // TODO: Decide on how far ago the timeago should be used
                            // TODO: Leverage Moment.js for the date time rendering as per timezone/region settings of browser or user preference..
                            //if ($attrs.ago) {
                            if ($attrs.title)
                                return '<time am-time-ago="' + $attrs.time + '" title="' + $attrs.title + '" datetime="{{' + $attrs.time + ' | date:\'yyyy - MM-ddTHH:mm: ss:Z\'}}" itemprop="datePublished"></time>';
                            return '<time am-time-ago="' + $attrs.time + '" title="{{' + $attrs.time + ' | date: \'medium\'}}" datetime="{{' + $attrs.time + ' | date:\'yyyy - MM-ddTHH:mm: ss:Z\'}}" itemprop="datePublished"></time>';
                            //}
                            //return "{{" + $attrs.time + " | date : \"MMMM d 'at' h:mma\"}}";
                        }
                    };
                }).
                directive("sxPasswordVerify", () => {
                    return {
                        require: "ngModel",
                        scope: {
                            passwordVerify: '=sxPasswordVerify'
                        },
                        link: (scope: any, element, attrs, ctrl) => {
                            scope.$watch(() => {
                                var combined;

                                if (scope.passwordVerify || ctrl.$viewValue) {
                                    combined = scope.passwordVerify + '_' + ctrl.$viewValue;
                                }
                                return combined;
                            }, value => {
                                if (value) {
                                    ctrl.$parsers.unshift(viewValue => {
                                        var origin = scope.passwordVerify;
                                        if (origin !== viewValue) {
                                            ctrl.$setValidity("passwordVerify", false);
                                            return undefined;
                                        } else {
                                            ctrl.$setValidity("passwordVerify", true);
                                            return viewValue;
                                        }
                                    });
                                }
                            });
                        }
                    };
                }).directive('sxBsDropdown', [
                    '$window', '$sce', '$dropdown', ($window, $sce, $dropdown) => {

                        return {
                            restrict: 'EAC',
                            scope: true,
                            link: (scope, element, attr: any, transclusion) => {

                                // Directive options
                                var options = { scope: scope, element: null };
                                angular.forEach(['placement', 'container', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'template', 'element'], function(key) {
                                    if (angular.isDefined(attr[key])) options[key] = attr[key];
                                });

                                // Support scope as an object
                                attr.bsDropdown && scope.$watch(attr.bsDropdown, function(newValue, oldValue) {
                                    scope.content = newValue;
                                }, true);

                                // Visibility binding support
                                attr.bsShow && scope.$watch(attr.bsShow, function(newValue, oldValue) {
                                    if (!dropdown || !angular.isDefined(newValue)) return;
                                    if (angular.isString(newValue)) newValue = !!newValue.match(/true|,?(dropdown),?/i);
                                    newValue === true ? dropdown.show() : dropdown.hide();
                                });

                                // Initialize dropdown
                                var dropdown = $dropdown(options.element ? options.element : element, options);

                                // Garbage collection
                                scope.$on('$destroy', function() {
                                    if (dropdown) dropdown.destroy();
                                    options = null;
                                    dropdown = null;
                                });

                            }
                        };
                    }
                ]).filter('reverse', function() {
                    return function (items) {
                        if (items == null)
                            return items;
                        return items.slice().reverse();
                    };
                })
                // TODO: just use <a href/ng-href ?
                .directive('clickLink', [
                    '$location', function($location) {
                        return {
                            link: function(scope, element, attrs) {
                                element.on('click', function() {
                                    scope.$apply(function() {
                                        $location.url(attrs.clickLink);
                                    });
                                });
                            }
                        };
                    }
                ])
                .directive('autoFocus', function() {
                    return {
                        link: {
                            pre: function preLink(scope, element, attr) {
                                // this fails since the element hasn't rendered
                                //element[0].focus();
                            },
                            post: function postLink(scope, element, attr) {
                                // this succeeds since the element has been rendered
                                element[0].focus();
                            }
                        }
                    };
                }).directive('collapseWidth', [
                    '$transition', function($transition, $timeout) {

                        return {
                            link: function(scope, element, attrs) {

                                var initialAnimSkip = true;
                                var currentTransition;

                                function doTransition(change) {
                                    var newTransition = $transition(element, change);
                                    if (currentTransition) {
                                        currentTransition.cancel();
                                    }
                                    currentTransition = newTransition;
                                    newTransition.then(newTransitionDone, newTransitionDone);
                                    return newTransition;

                                    function newTransitionDone() {
                                        // Make sure it's this transition, otherwise, leave it alone.
                                        if (currentTransition === newTransition) {
                                            currentTransition = undefined;
                                        }
                                    }
                                }

                                function expand() {
                                    if (initialAnimSkip) {
                                        initialAnimSkip = false;
                                        expandDone();
                                    } else {
                                        element.removeClass('collapse').addClass('collapsing-width');
                                        doTransition({ width: element[0].scrollWidth + 'px' }).then(expandDone);
                                    }
                                }

                                function expandDone() {
                                    element.removeClass('collapsing-width');
                                    element.addClass('collapse in');
                                    element.css({ width: 'auto' });
                                }

                                function collapse() {
                                    if (initialAnimSkip) {
                                        initialAnimSkip = false;
                                        collapseDone();
                                        element.css({ width: 0 });
                                    } else {
                                        // CSS transitions don't work with height: auto, so we have to manually change the height to a specific value
                                        element.css({ width: element[0].scrollWidth + 'px' });
                                        //trigger reflow so a browser realizes that height was updated from auto to a specific value
                                        var x = element[0].offsetHeight;

                                        element.removeClass('collapse in').addClass('collapsing-width');

                                        doTransition({ width: 0 }).then(collapseDone);
                                    }
                                }

                                function collapseDone() {
                                    element.removeClass('collapsing-width');
                                    element.addClass('collapse');
                                }

                                scope.$watch(attrs.collapseWidth, function(shouldCollapse) {
                                    if (shouldCollapse) {
                                        collapse();
                                    } else {
                                        expand();
                                    }
                                });
                            }
                        };
                    }
                ]).factory('focus', function($timeout) {
                    return function(id) {
                        // timeout makes sure that is invoked after any other event has been triggered.
                        // e.g. click events that need to run before the focus or
                        // inputs elements that are in a disabled state but are enabled when those events
                        // are triggered.
                        $timeout(function() {
                            var element = document.getElementById(id);
                            if (element)
                                element.focus();
                        });
                    };
                })
                .directive('eventFocus', function(focus) {
                    return function(scope, elem, attr) {
                        elem.on(attr.eventFocus, function() {
                            focus(attr.eventFocusId);
                        });

                        // Removes bound events in the element itself
                        // when the scope is destroyed

                        scope.$on('$destroy', function() {
                            elem.off(attr.eventFocus);
                        });
                    };
                })
                .controller('Ctrl', function($scope, focus) {
                    $scope.doSomething = function() {
                        // do something awesome
                        focus('email');
                    };
                });
        }
    }

    class MultiTranscludeDirectiveController {
        static $inject = ['$scope', '$element', '$attrs', '$transclude'];

        constructor($scope, $element, $attrs, $transclude) {
            if (!$transclude) {
                throw {
                    name: 'DirectiveError',
                    message: 'sx-multi-transclude found without parent requesting transclusion'
                };
            }
            this.$transclude = $transclude;
        }

        $transclude;
    }

    var app = new DirectivesComponent();

    angular.module('xeditable').factory('editableController2',
    [
        '$q', 'editableUtils',
        function($q, editableUtils) {

            //EditableController function
            EditableController.$inject = ['$scope', '$attrs', '$element', '$parse', 'editableThemes', 'editableIcons', 'editableOptions', '$rootScope', '$compile', '$q'];

            function EditableController($scope, $attrs, $element, $parse, editableThemes, editableIcons, editableOptions, $rootScope, $compile, $q) {
                var valueGetter;

                //if control is disabled - it does not participate in waiting process
                var inWaiting;

                var self = this;

                self.scope = $scope;
                self.elem = $element;
                self.attrs = $attrs;
                self.inputEl = null;
                self.editorEl = null;
                self.single = true;
                self.error = '';
                self.theme = editableThemes[editableOptions.theme] || editableThemes['default'];
                self.parent = {};

                //will be undefined if icon_set is default and theme is default
                self.icon_set = editableOptions.icon_set === 'default' ? editableIcons.default[editableOptions.theme] : editableIcons.external[editableOptions.icon_set];

                //to be overwritten by directive
                self.inputTpl = '';
                self.directiveName = '';

                // with majority of controls copy is not needed, but..
                // copy MUST NOT be used for `select-multiple` with objects as items
                // copy MUST be used for `checklist`
                self.useCopy = false;

                //runtime (defaults)
                self.single = null;

                /**
                 * Attributes defined with `e-*` prefix automatically transfered from original element to
                 * control.
                 * For example, if you set `<span editable-text="user.name" e-style="width: 100px"`>
                 * then input will appear as `<input style="width: 100px">`.
                 * See [demo](#text-customize).
                 *
                 * @var {any|attribute} e-*
                 * @memberOf editable-element
                 */

                /**
                 * Whether to show ok/cancel buttons. Values: `right|no`.
                 * If set to `no` control automatically submitted when value changed.
                 * If control is part of form buttons will never be shown.
                 *
                 * @var {string|attribute} buttons
                 * @memberOf editable-element
                 */
                self.buttons = 'right';
                /**
                 * Action when control losses focus. Values: `cancel|submit|ignore`.
                 * Has sense only for single editable element.
                 * Otherwise, if control is part of form - you should set `blur` of form, not of individual element.
                 *
                 * @var {string|attribute} blur
                 * @memberOf editable-element
                 */
                // no real `blur` property as it is transfered to editable form

                //init
                self.init = function(single) {
                    self.single = single;

                    self.name = $attrs.eName || $attrs[self.directiveName];
                    /*
                    if(!$attrs[directiveName] && !$attrs.eNgModel && ($attrs.eValue === undefined)) {
                      throw 'You should provide value for `'+directiveName+'` or `e-value` in editable element!';
                    }
                    */
                    if ($attrs[self.directiveName]) {
                        valueGetter = $parse($attrs[self.directiveName]);
                    } else {
                        throw 'You should provide value for `' + self.directiveName + '` in editable element!';
                    }

                    // settings for single and non-single
                    if (!self.single) {
                        // hide buttons for non-single
                        self.buttons = 'no';
                    } else {
                        self.buttons = self.attrs.buttons || editableOptions.buttons;
                    }

                    //if name defined --> watch changes and update $data in form
                    if ($attrs.eName) {
                        self.scope.$watch('$data', function(newVal) {
                            self.scope.$form.$data[$attrs.eName] = newVal;
                        });
                    }

                    /**
                     * Called when control is shown.
                     * See [demo](#select-remote).
                     *
                     * @var {method|attribute} onshow
                     * @memberOf editable-element
                     */
                    if ($attrs.onshow) {
                        self.onshow = function() {
                            return self.catchError($parse($attrs.onshow)($scope));
                        };
                    }

                    /**
                     * Called when control is hidden after both save or cancel.
                     *
                     * @var {method|attribute} onhide
                     * @memberOf editable-element
                     */
                    if ($attrs.onhide) {
                        self.onhide = function() {
                            return $parse($attrs.onhide)($scope);
                        };
                    }

                    /**
                     * Called when control is cancelled.
                     *
                     * @var {method|attribute} oncancel
                     * @memberOf editable-element
                     */
                    if ($attrs.oncancel) {
                        self.oncancel = function() {
                            return $parse($attrs.oncancel)($scope);
                        };
                    }

                    /**
                     * Called during submit before value is saved to model.
                     * See [demo](#onbeforesave).
                     *
                     * @var {method|attribute} onbeforesave
                     * @memberOf editable-element
                     */
                    if ($attrs.onbeforesave) {
                        self.onbeforesave = function() {
                            return self.catchError($parse($attrs.onbeforesave)($scope));
                        };
                    }

                    /**
                     * Called during submit after value is saved to model.
                     * See [demo](#onaftersave).
                     *
                     * @var {method|attribute} onaftersave
                     * @memberOf editable-element
                     */
                    if ($attrs.onaftersave) {
                        self.onaftersave = function() {
                            return self.catchError($parse($attrs.onaftersave)($scope));
                        };
                    }

                    // watch change of model to update editable element
                    // now only add/remove `editable-empty` class.
                    // Initially this method called with newVal = undefined, oldVal = undefined
                    // so no need initially call handleEmpty() explicitly
                    $scope.$parent.$watch($attrs[self.directiveName], function(newVal, oldVal) {
                        self.setLocalValue();
                        self.handleEmpty();
                    });
                };

                self.render = function() {
                    var theme = self.theme;

                    //build input
                    self.inputEl = angular.element(self.inputTpl);

                    //build controls
                    self.controlsEl = angular.element(theme.controlsTpl);
                    self.controlsEl.append(self.inputEl);

                    //build buttons
                    if (self.buttons !== 'no') {
                        self.buttonsEl = angular.element(theme.buttonsTpl);
                        self.submitEl = angular.element(theme.submitTpl);
                        self.cancelEl = angular.element(theme.cancelTpl);
                        if (self.icon_set) {
                            self.submitEl.find('span').addClass(self.icon_set.ok);
                            self.cancelEl.find('span').addClass(self.icon_set.cancel);
                        }
                        self.buttonsEl.append(self.submitEl).append(self.cancelEl);
                        self.controlsEl.append(self.buttonsEl);

                        self.inputEl.addClass('editable-has-buttons');
                    }

                    //build error
                    self.errorEl = angular.element(theme.errorTpl);
                    self.controlsEl.append(self.errorEl);

                    //build editor
                    self.editorEl = angular.element(self.single ? theme.formTpl : theme.noformTpl);
                    self.editorEl.append(self.controlsEl);

                    // transfer `e-*|data-e-*|x-e-*` attributes
                    for (var k in $attrs.$attr) {
                        if (k.length <= 1) {
                            continue;
                        }
                        var transferAttr = <any>false;
                        var nextLetter = k.substring(1, 2);

                        // if starts with `e` + uppercase letter
                        if (k.substring(0, 1) === 'e' && nextLetter === nextLetter.toUpperCase()) {
                            transferAttr = k.substring(1); // cut `e`
                        } else {
                            continue;
                        }

                        // exclude `form` and `ng-submit`,
                        if (transferAttr === 'Form' || transferAttr === 'NgSubmit') {
                            continue;
                        }

                        // convert back to lowercase style
                        transferAttr = transferAttr.substring(0, 1).toLowerCase() + editableUtils.camelToDash(transferAttr.substring(1));

                        // workaround for attributes without value (e.g. `multiple = "multiple"`)
                        // except for 'e-value'
                        var attrValue = (transferAttr !== 'value' && $attrs[k] === '') ? transferAttr : $attrs[k];

                        // set attributes to input
                        self.inputEl.attr(transferAttr, attrValue);
                    }

                    self.inputEl.addClass('editable-input');
                    self.inputEl.attr('ng-model', '$data');

                    // add directiveName class to editor, e.g. `editable-text`
                    self.editorEl.addClass(editableUtils.camelToDash(self.directiveName));

                    if (self.single) {
                        self.editorEl.attr('editable-form', '$form');
                        // transfer `blur` to form
                        self.editorEl.attr('blur', self.attrs.blur || (self.buttons === 'no' ? 'cancel' : editableOptions.blurElem));
                    }

                    //apply `postrender` method of theme
                    if (angular.isFunction(theme.postrender)) {
                        theme.postrender.call(self);
                    }

                };

                // with majority of controls copy is not needed, but..
                // copy MUST NOT be used for `select-multiple` with objects as items
                // copy MUST be used for `checklist`
                self.setLocalValue = function() {
                    self.scope.$data = self.useCopy ?
                        angular.copy(valueGetter($scope.$parent)) :
                        valueGetter($scope.$parent);
                };

                //show
                self.show = function() {
                    // set value of scope.$data
                    self.setLocalValue();

                    /*
                    Originally render() was inside init() method, but some directives polluting editorEl,
                    so it is broken on second openning.
                    Cloning is not a solution as jqLite can not clone with event handler's.
                    */
                    self.render();

                    // insert into DOM
                    $element.after(self.editorEl);

                    // compile (needed to attach ng-* events from markup)
                    $compile(self.editorEl)($scope);

                    // attach listeners (`escape`, autosubmit, etc)
                    self.addListeners();

                    // hide element
                    $element.addClass('editable-hide');

                    // onshow
                    return self.onshow();
                };

                //hide
                self.hide = function() {
                    self.editorEl.remove();
                    $element.removeClass('editable-hide');

                    // onhide
                    return self.onhide();
                };

                // cancel
                self.cancel = function() {
                    // oncancel
                    self.oncancel();
                    // don't call hide() here as it called in form's code
                };

                /*
                Called after show to attach listeners
                */
                self.addListeners = function() {
                    // bind keyup for `escape`
                    self.inputEl.bind('keyup', function(e) {
                        if (!self.single) {
                            return;
                        }

                        // todo: move this to editable-form!
                        switch (e.keyCode) {
                            // hide on `escape` press
                        case 27:
                            self.scope.$apply(function() {
                                self.scope.$form.$cancel();
                            });
                            break;
                        }
                    });

                    // autosubmit when `no buttons`
                    if (self.single && self.buttons === 'no') {
                        self.autosubmit();
                    }

                    // click - mark element as clicked to exclude in document click handler
                    self.editorEl.bind('click', function(e) {
                        // ignore right/middle button click
                        if (e.which && e.which !== 1) {
                            return;
                        }

                        if (self.scope.$form.$visible) {
                            self.scope.$form._clicked = true;
                        }
                    });
                };

                // setWaiting
                self.setWaiting = function(value) {
                    if (value) {
                        // participate in waiting only if not disabled
                        inWaiting = !self.inputEl.attr('disabled') &&
                            !self.inputEl.attr('ng-disabled') &&
                            !self.inputEl.attr('ng-enabled');
                        if (inWaiting) {
                            self.inputEl.attr('disabled', 'disabled');
                            if (self.buttonsEl) {
                                self.buttonsEl.find('button').attr('disabled', 'disabled');
                            }
                        }
                    } else {
                        if (inWaiting) {
                            self.inputEl.removeAttr('disabled');
                            if (self.buttonsEl) {
                                self.buttonsEl.find('button').removeAttr('disabled');
                            }
                        }
                    }
                };

                self.activate = function(start, end) {
                    setTimeout(function() {
                        var el = self.inputEl[0];
                        if (editableOptions.activate === 'focus' && el.focus) {
                            if (start) {
                                end = end || start;
                                el.onfocus = function() {
                                    var that = this;
                                    setTimeout(function() {
                                        that.setSelectionRange(start, end);
                                    });
                                };
                            }
                            el.focus();
                        }
                        if (editableOptions.activate === 'select' && el.select) {
                            el.select();
                        }
                    }, 0);
                };

                self.setError = function(msg) {
                    if (!angular.isObject(msg)) {
                        $scope.$error = msg;
                        self.error = msg;
                    }
                };

                /*
                Checks that result is string or promise returned string and shows it as error message
                Applied to onshow, onbeforesave, onaftersave
                */
                self.catchError = function(result, noPromise) {
                    if (angular.isObject(result) && noPromise !== true) {
                        $q.when(result).then(
                            //success and fail handlers are equal
                            angular.bind(this, function(r) {
                                this.catchError(r, true);
                            }),
                            angular.bind(this, function(r) {
                                this.catchError(r, true);
                            })
                        );
                        //check $http error
                    } else if (noPromise && angular.isObject(result) && result.status &&
                    (result.status !== 200) && result.data && angular.isString(result.data)) {
                        this.setError(result.data);
                        //set result to string: to let form know that there was error
                        result = result.data;
                    } else if (angular.isString(result)) {
                        this.setError(result);
                    }
                    return result;
                };

                self.save = function() {
                    valueGetter.assign($scope.$parent,
                        self.useCopy ? angular.copy(self.scope.$data) : self.scope.$data);

                    // no need to call handleEmpty here as we are watching change of model value
                    // self.handleEmpty();
                };

                /*
                attach/detach `editable-empty` class to element
                */
                self.handleEmpty = function() {
                    var val = valueGetter($scope.$parent);
                    var isEmpty = val === null || val === undefined || val === "" || (angular.isArray(val) && val.length === 0);
                    $element.toggleClass('editable-empty', isEmpty);
                };

                /*
                Called when `buttons = "no"` to submit automatically
                */
                self.autosubmit = angular.noop;

                self.onshow = angular.noop;
                self.onhide = angular.noop;
                self.oncancel = angular.noop;
                self.onbeforesave = angular.noop;
                self.onaftersave = angular.noop;
            }

            return EditableController;
        }
    ]);
//#region editableMarkdown
    angular.module('xeditable').directive('editableMarkdown', [
        'editableLinkDirectiveFactory',
        editableDirectiveFactory => editableDirectiveFactory({
            directiveName: 'editableMarkdown',
            inputTpl: '<textarea sx-pagedown></textarea>',
            addListeners: function() {
                var self = this;
                self.parent.addListeners.call(self);
                // submit textarea by ctrl+enter even with buttons
                if (self.single && self.buttons !== 'no') {
                    self.autosubmit();
                }
            },
            autosubmit: function() {
                var self = this;
                self.inputEl.bind('keydown', function(e) {
                    if ((e.ctrlKey || e.metaKey) && (e.keyCode === 13)) {
                        self.scope.$apply(function() {
                            self.scope.$form.$submit();
                        });
                    }
                });
            },
            render: function() {
                var self = this;

                self.parent.render();

                self.editorEl.attr('blur', '');
            },
            activate: function() {
                //var self = this;

                //setTimeout(function() {
                //    var elem = <HTMLFormElement>self.editorEl[0];
                //    $(elem).find(".wmd-input").focus();
                //}, 0);
            }
        })
    ]);

    angular.module('xeditable').directive('editableHtml', [
        'editableLinkDirectiveFactory', '$timeout',
        (editableDirectiveFactory, $timeout) => editableDirectiveFactory({
            directiveName: 'editableHtml',
            inputTpl: '<textarea redactor="{blurCallback: initBlur(), keydownCallback: initKeydown()}"></textarea>',
            addListeners: function() {
                var self = this;
                self.parent.addListeners.call(self);
                // submit textarea by ctrl+enter even with buttons
                if (self.single && self.buttons !== 'no') {
                    self.autosubmit();
                }
            },
            autosubmit: function() {
                var self = this;
                self.keydownEvents = self.keyDownEvents || [];
                //self.inputEl.bind('keydown',
                self.keydownEvents.push(e => {
                    if ((e.ctrlKey || e.metaKey) && (e.keyCode === 13)) {
                        this.scope.$apply(() => {
                            this.scope.$form.$submit();
                        });
                    }
                });
                self.blurEvents = self.blurEvents || [];
                if (self.attrs.blurSaves != undefined) {
                    self.blurEvents = self.blurEvents || [];
                    //self.inputEl.bind('blur',
                    self.blurEvents.push((e) => {
                        self.scope.$apply(() => {
                            self.scope.$form.$submit();
                        });
                    });
                }
            },
            render: function() {
                var self = this;
                // TODO: Consider if it would make sense to proxy these events to the actual textarea element
                // (so disable these events on the textarea itself, then raise these events as if it were the textarea's own events)
                // this would at least make the editor more compatible with anything listening for these events??

                self.scope.initBlur = () => self.scope.blur; // helper to attach the event handler
                self.scope.initKeydown = () => self.scope.keydown; // helper to attach the event handler
                self.scope.blur = e => { if (self.blurEvents) angular.forEach(self.blurEvents, x => x(e)); };
                self.scope.keydown = e => { if (self.keydownEvents) angular.forEach(self.keydownEvents, x => x(e)); };
                self.parent.render();

                // TODO: This makes no sense?
                self.editorEl.attr('blur', '');
                if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
                    self.editorEl.attr('blur', '');
            },
            activate: function() {
                $timeout(() => {
                    var elem = <HTMLFormElement>this.editorEl[0];
                    $(elem).find('textarea[redactor]').redactor('core.getObject').focus.setStart();
                }, 0);
            }
        })
    ]);

    angular.module('xeditable').directive('sxEditableTextarea', [
        'editableLinkDirectiveFactory',
        editableDirectiveFactory => editableDirectiveFactory({
            directiveName: 'sxEditableTextarea',
            inputTpl: '<textarea></textarea>',
            addListeners: function() {
                var self = this;
                self.parent.addListeners.call(self);
                // submit textarea by ctrl+enter even with buttons
                if (self.single && self.buttons !== 'no') {
                    self.autosubmit();
                }
            },
            autosubmit: function() {
                var self = this;
                self.inputEl.bind('keydown', e => {
                    if ((e.ctrlKey || e.metaKey) && (e.keyCode === 13)) {
                        this.scope.$apply(() => {
                            this.scope.$form.$submit();
                        });
                    }
                });
                if (self.attrs.blurSaves != undefined)
                    self.inputEl.bind('blur', (e) => {
                        self.scope.$apply(() => {
                            self.scope.$form.$submit();
                        });
                    });
            },
            render: function() {
                var self = this;

                self.parent.render();

                self.editorEl.attr('blur', '');
                if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
                    self.editorEl.attr('blur', '');
            },
            activate: () => {
                //var self = this;

                //setTimeout(function() {
                //    var elem = <HTMLFormElement>self.editorEl[0];
                //    $(elem).find(".wmd-input").focus();
                //}, 0);
            }
        })
    ]);

//#endregion
    angular.module('xeditable').directive('editableMarkdownPreviewFirst', [
        'editableLinkDirectiveFactory',
        editableDirectiveFactory => editableDirectiveFactory({
            directiveName: 'editableMarkdownPreviewFirst',
            inputTpl: '<textarea sx-pagedown preview-first></textarea>',
            addListeners: function() {
                var self = this;
                self.parent.addListeners.call(self);
                // submit textarea by ctrl+enter even with buttons
                if (self.single && self.buttons !== 'no') {
                    self.autosubmit();
                }
            },
            autosubmit: function() {
                var self = this;
                self.editorEl.bind('keydown', function(e) {
                    if ((e.ctrlKey || e.metaKey) && (e.keyCode === 13)) {
                        self.scope.$apply(function() {
                            self.scope.$form.$submit();
                        });
                    }
                });
                if (self.attrs.blurSaves != undefined)
                    self.inputEl.bind('blur', (e) => {
                        self.scope.$apply(() => {
                            self.scope.$form.$submit();
                        });
                    });
            },
            render: function() {
                var self = this;

                self.parent.render();

                self.editorEl.attr('blur', '');
                if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
                    self.editorEl.attr('blur', '');
            },
            activate: function() {
                //var self = this;

                //setTimeout(function () {
                //    var elem = <HTMLFormElement>self.editorEl[0];
                //    $(elem).find(".wmd-input").focus();
                //}, 0);
            }
        })
    ]);
    angular.module('xeditable').directive('editableTagAutoComplete', [
        'editableDirectiveFactory', '$parse',
        (editableDirectiveFactory, $parse) => {
            return editableDirectiveFactory({
                directiveName: 'editableTagAutoComplete',
                inputTpl: '<tags-input replace-spaces-with-dashes="false" min-tags="0" allow-leftover-text="false" enable-editing-last-tag="false"><auto-complete min-length="0" debounce-delay="500" display-property="text"></auto-complete></tags-input>',
                link: function(scope, elem, attrs, ctrl) {
                    var self = this;

                    scope.$watch('e-form', function(newValue, oldValue) {
                        if (newValue)
                            Debug.log("I see a data change!");
                    }, true);

                    self.parent.link(scope, elem, attrs, ctrl);
                },
                addListeners: function() {
                    var self = this;
                    self.parent.addListeners.call(self);
                },
                autosubmit: function() {
                    var self = this;
                    self.inputEl.bind('keydown', function(e) {
                        if ((e.ctrlKey || e.metaKey) && (e.keyCode === 13)) {
                            self.scope.$apply(function() {
                                self.scope.$form.$submit();
                            });
                        }
                    });
                    if (self.attrs.blurSaves != undefined)
                        self.inputEl.bind('blur', (e) => {
                            self.scope.$apply(() => {
                                self.scope.$form.$submit();
                            });
                        });
                },
                render: function() {
                    var self = this;
                    var elem = <HTMLElement>angular.element(self.inputTpl)[0];
                    var acNode = <HTMLElement>elem.childNodes[0];

                    elem.setAttribute("on-tag-added", self.attrs.onTagAdded.replace("$data", "$tag"));
                    acNode.setAttribute("source", self.attrs.source);

                    if (self.attrs.inline != undefined) {
                        elem.classList.add("hide-tags");
                    }

                    if (self.attrs.placeholder != undefined) {
                        elem.setAttribute("placeholder", self.attrs.placeholder);
                    }

                    if (self.attrs.addFromAutocompleteOnly != undefined) {
                        elem.setAttribute("add-from-autocomplete-only", self.attrs.addFromAutocompleteOnly);
                    }

                    if (self.attrs.loadOnFocus != undefined) {
                        acNode.setAttribute("load-on-focus", self.attrs.loadOnFocus);
                    }
                    if (self.attrs.loadOnEmpty != undefined) {
                        acNode.setAttribute("load-on-empty", self.attrs.loadOnEmpty);
                    }
                    if (self.attrs.maxResultsToShow != undefined) {
                        acNode.setAttribute("max-results-to-show", self.attrs.maxResultsToShow);
                    }


                    if (self.attrs.displayProperty != undefined) {
                        elem.setAttribute("display-property", self.attrs.displayProperty);
                    } else {
                        elem.setAttribute("display-property", "text");
                    }

                    self.scope.$data = $parse(self.attrs.tags)(self.scope);

                    self.inputTpl = elem.outerHTML;

                    self.parent.render();

                    self.editorEl.attr('unsaved-warning-form', '');

                    if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
                        self.editorEl.attr('blur', '');

                },
                activate: function() {
                    var self = this;

                    setTimeout(function() {
                        var elem = <HTMLFormElement>self.editorEl[0];
                        $(elem).find(".tags").find("input.input").focus();
                    }, 0);
                }
            });

        }
    ]);
    var types = 'text|email|tel|number|url|search|color|date|datetime|time|month|week'.split('|');

    //todo: datalist

    // generate directives
    angular.forEach(types, function(type) {
        var directiveName = 'sxEditable' + type.charAt(0).toUpperCase() + type.slice(1);
        angular.module('xeditable').directive(directiveName, [
            'editableLinkDirectiveFactory',
            function(editableDirectiveFactory) {
                return editableDirectiveFactory({
                    directiveName: directiveName,
                    inputTpl: '<input type="' + type + '">',
                    autosubmit: function() {
                        var self = this;
                        if (self.attrs.blurSaves != undefined)
                            self.inputEl.bind('blur', (e) => {
                                self.scope.$apply(() => {
                                    self.scope.$form.$submit();
                                });
                            });
                    },
                    render: function() {
                        var self = this;

                        self.parent.render();
                        if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
                            self.editorEl.attr('blur', '');
                    }
                });
            }
        ]);
    });

    angular.module('xeditable').directive('sxEditableSelect', [
        'editableDirectiveFactory2',
        function(editableDirectiveFactory) {
            return editableDirectiveFactory({
                directiveName: 'sxEditableSelect',
                inputTpl: '<select></select>',
                autosubmit: function() {
                    var self = this;
                    self.inputEl.bind('change', (e) => {
                        self.scope.$apply(() => {
                            self.scope.$form.$submit();
                        });
                    });
                    if (self.attrs.blurSaves != undefined)
                        self.inputEl.bind('blur', (e) => {
                            self.scope.$apply(() => {
                                self.scope.$form.$submit();
                            });
                        });
                },
                render: function() {
                    var self = this;

                    self.parent.render();
                    if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
                        self.editorEl.attr('blur', '');
                }
            });
        }
    ]);

    //`range` is bit specific
    angular.module('xeditable').directive('sxEditableRange', [
        'editableLinkDirectiveFactory',
        function(editableDirectiveFactory) {
            return editableDirectiveFactory({
                directiveName: 'editableRange',
                inputTpl: '<input type="range" id="range" name="range">',
                autosubmit: function() {
                    var self = this;
                    if (self.attrs.blurSaves != undefined)
                        self.inputEl.bind('blur', (e) => {
                            self.scope.$apply(() => {
                                self.scope.$form.$submit();
                            });
                        });
                },
                render: function() {
                    var self = this;
                    this.parent.render.call(this);
                    this.inputEl.after('<output>{{$data}}</output>');
                    if (self.attrs.noBlur != undefined || self.attrs.blurSaves != undefined)
                        self.editorEl.attr('blur', '');
                }
            });
        }
    ]);

    /*
editableFactory is used to generate editable directives (see `/directives` folder)
Inside it does several things:
- detect form for editable element. Form may be one of three types:
  1. autogenerated form (for single editable elements)
  2. wrapper form (element wrapped by <form> tag)
  3. linked form (element has `e-form` attribute pointing to existing form)

- attach editableController to element

Depends on: editableController, editableFormFactory
*/
    angular.module('xeditable').factory('editableLinkDirectiveFactory',
    [
        '$parse', '$compile', 'editableThemes', '$rootScope', '$document', 'editableController2', 'editableFormController',
        ($parse, $compile, editableThemes, $rootScope, $document, editableController, editableFormController) => overwrites => {
            return {
                restrict: 'A',
                scope: {
                    editing: '=',
                    canEdit: '=',
                    onaftersave: '@'
                },
                require: [overwrites.directiveName, '?^form'],
                controller: editableController,
                link: function(scope, elem, attrs, ctrl) {
                    // editable controller
                    var eCtrl = ctrl[0];

                    // form controller
                    var eFormCtrl;

                    // this variable indicates is element is bound to some existing form,
                    // or it's single element who's form will be generated automatically
                    // By default consider single element without any linked form.ß
                    var hasForm = false;

                    // element wrapped by form
                    if (ctrl[1]) {
                        eFormCtrl = ctrl[1];
                        hasForm = true;
                    } else if (attrs.eForm) { // element not wrapped by <form>, but we hane `e-form` attr
                        var getter = $parse(attrs.eForm)(scope);
                        if (getter) { // form exists in scope (above), e.g. editable column
                            eFormCtrl = getter;
                            hasForm = true;
                        } else { // form exists below or not exist at all: check document.forms
                            for (var i = 0; i < $document[0].forms.length; i++) {
                                if ($document[0].forms[i].name === attrs.eForm) {
                                    // form is below and not processed yet
                                    eFormCtrl = null;
                                    hasForm = true;
                                    break;
                                }
                            }
                        }
                    }

                    /*
                            if(hasForm && !attrs.eName) {
                              throw new Error('You should provide `e-name` for editable element inside form!');
                            }
                            */

                    //check for `editable-form` attr in form
                    /*
                            if(eFormCtrl && ) {
                              throw new Error('You should provide `e-name` for editable element inside form!');
                            }
                            */

                    // store original props to `parent` before merge
                    angular.forEach(overwrites, function(v, k) {
                        if (eCtrl[k] !== undefined) {
                            eCtrl.parent[k] = eCtrl[k];
                        }
                    });

                    // merge overwrites to base editable controller
                    angular.extend(eCtrl, overwrites);

                    // init editable ctrl
                    eCtrl.init(!hasForm);

                    // publich editable controller as `$editable` to be referenced in html
                    scope.$editable = eCtrl;

                    // add `editable` class to element
                    elem.addClass('editable');
                    if (attrs.canEdit) {
                        scope.$watch("canEdit", (newValue, oldValue) => {
                            if (newValue == oldValue)
                                return;
                            if (newValue) {
                                elem.addClass('editable-click');
                            } else {
                                elem.removeClass('editable-click');
                            }

                        }, true);
                    }

                    scope.$watch("editing", (newValue, oldValue) => {
                        if (newValue == oldValue)
                            return;
                        if (newValue > oldValue) {
                            scope.$form.$show();
                        } else {
                            scope.$form.$hide();
                        }
                    });

                    // hasForm
                    if (hasForm) {
                        if (eFormCtrl) {
                            scope.$form = eFormCtrl;
                            if (!scope.$form.$addEditable) {
                                throw new Error('Form with editable elements should have `editable-form` attribute.');
                            }
                            scope.$form.$addEditable(eCtrl);
                        } else {
                            // future form (below): add editable controller to buffer and add to form later
                            $rootScope.$$editableBuffer = $rootScope.$$editableBuffer || {};
                            $rootScope.$$editableBuffer[attrs.eForm] = $rootScope.$$editableBuffer[attrs.eForm] || [];
                            $rootScope.$$editableBuffer[attrs.eForm].push(eCtrl);
                            scope.$form = null; //will be re-assigned later
                        }
                        // !hasForm
                    } else {
                        // create editableform controller
                        scope.$form = editableFormController();
                        // add self to editable controller
                        scope.$form.$addEditable(eCtrl);

                        // if `e-form` provided, publish local $form in scope
                        if (attrs.eForm) {
                            scope.$parent[attrs.eForm] = scope.$form;
                        }
                        if (attrs.canEdit) {
                            if (scope.canEdit)
                                elem.addClass('editable-click');

                            elem.bind('click', function(e) {
                                if (!scope.canEdit) {
                                    return;
                                }
                                e.preventDefault();
                                e.editable = eCtrl;
                                scope.$apply(function() {
                                    scope.$form.$show();
                                });
                            });
                        } else {
                            elem.addClass('editable-click');
                            elem.bind('click', function(e) {
                                e.preventDefault();
                                e.editable = eCtrl;
                                scope.$apply(function() {
                                    scope.$form.$show();
                                });
                            });
                        }
                        if (attrs.editing && scope.editing > 0) {
                            //scope.$apply(function () {
                            scope.$form.$show();
                            //});
                        }
                    }

                }
            };
        }
    ]); //directive object

    /*
editableFactory is used to generate editable directives (see `/directives` folder)
Inside it does several things:
- detect form for editable element. Form may be one of three types:
  1. autogenerated form (for single editable elements)
  2. wrapper form (element wrapped by <form> tag)
  3. linked form (element has `e-form` attribute pointing to existing form)
- attach editableController to element
Depends on: editableController, editableFormFactory
*/
    angular.module('xeditable').factory('editableDirectiveFactory2',
    [
        '$parse', '$compile', 'editableThemes', '$rootScope', '$document', 'editableController2', 'editableFormController', 'editableOptions',
        function($parse, $compile, editableThemes, $rootScope, $document, editableController, editableFormController, editableOptions) {

            //directive object
            return function(overwrites) {
                return {
                    restrict: 'A',
                    scope: {
                        editing: '=',
                        canEdit: '=',
                        onaftersave: '@',
                        eNgOptions: '@'
                    },
                    require: [overwrites.directiveName, '?^form'],
                    controller: editableController,
                    link: function(scope, elem, attrs, ctrl) {
                        // editable controller
                        var eCtrl = ctrl[0];

                        // form controller
                        var eFormCtrl;

                        // this variable indicates is element is bound to some existing form,
                        // or it's single element who's form will be generated automatically
                        // By default consider single element without any linked form.ß
                        var hasForm = false;

                        // element wrapped by form
                        if (ctrl[1]) {
                            eFormCtrl = ctrl[1];
                            hasForm = true;
                        } else if (attrs.eForm) { // element not wrapped by <form>, but we hane `e-form` attr
                            var getter = $parse(attrs.eForm)(scope);
                            if (getter) { // form exists in scope (above), e.g. editable column
                                eFormCtrl = getter;
                                hasForm = true;
                            } else { // form exists below or not exist at all: check document.forms
                                for (var i = 0; i < $document[0].forms.length; i++) {
                                    if ($document[0].forms[i].name === attrs.eForm) {
                                        // form is below and not processed yet
                                        eFormCtrl = null;
                                        hasForm = true;
                                        break;
                                    }
                                }
                            }
                        }

                        /*
                            if(hasForm && !attrs.eName) {
                              throw 'You should provide `e-name` for editable element inside form!';
                            }
                            */

                        //check for `editable-form` attr in form
                        /*
                            if(eFormCtrl && ) {
                              throw 'You should provide `e-name` for editable element inside form!';
                            }
                            */

                        // store original props to `parent` before merge
                        angular.forEach(overwrites, function(v, k) {
                            if (eCtrl[k] !== undefined) {
                                eCtrl.parent[k] = eCtrl[k];
                            }
                        });

                        // merge overwrites to base editable controller
                        angular.extend(eCtrl, overwrites);

                        // x-editable can be disabled using editableOption or edit-disabled attribute
                        var disabled = angular.isDefined(attrs.editDisabled) ?
                            scope.$eval(attrs.editDisabled) :
                            editableOptions.isDisabled;

                        if (disabled) {
                            return;
                        }

                        // init editable ctrl
                        eCtrl.init(!hasForm);

                        // publich editable controller as `$editable` to be referenced in html
                        scope.$editable = eCtrl;

                        // add `editable` class to element
                        elem.addClass('editable');
                        if (attrs.canEdit) {
                            scope.$watch("canEdit", (newValue, oldValue) => {
                                if (newValue == oldValue)
                                    return;
                                if (newValue) {
                                    elem.addClass('editable-click');
                                } else {
                                    elem.removeClass('editable-click');
                                }

                            }, true);
                        }
                        scope.$watch("editing", (newValue, oldValue) => {
                            if (newValue == oldValue)
                                return;
                            if (newValue > oldValue) {
                                scope.$form.$show();
                            } else {
                                scope.$form.$hide();
                            }
                        });

                        // hasForm
                        if (hasForm) {
                            if (eFormCtrl) {
                                scope.$form = eFormCtrl;
                                if (!scope.$form.$addEditable) {
                                    throw 'Form with editable elements should have `editable-form` attribute.';
                                }
                                scope.$form.$addEditable(eCtrl);
                            } else {
                                // future form (below): add editable controller to buffer and add to form later
                                $rootScope.$$editableBuffer = $rootScope.$$editableBuffer || {};
                                $rootScope.$$editableBuffer[attrs.eForm] = $rootScope.$$editableBuffer[attrs.eForm] || [];
                                $rootScope.$$editableBuffer[attrs.eForm].push(eCtrl);
                                scope.$form = null; //will be re-assigned later
                            }
                            // !hasForm
                        } else {
                            // create editableform controller
                            scope.$form = editableFormController();
                            // add self to editable controller
                            scope.$form.$addEditable(eCtrl);

                            // if `e-form` provided, publish local $form in scope
                            if (attrs.eForm) {
                                scope.$parent[attrs.eForm] = scope.$form;
                            }

                            if (attrs.canEdit) {
                                if (scope.canEdit)
                                    elem.addClass('editable-click');

                                elem.bind('click', function(e) {
                                    if (!scope.canEdit) {
                                        return;
                                    }
                                    e.preventDefault();
                                    e.editable = eCtrl;
                                    scope.$apply(function() {
                                        scope.$form.$show();
                                    });
                                });
                            } else {
                                elem.addClass('editable-click');
                                elem.bind('click', function(e) {
                                    e.preventDefault();
                                    e.editable = eCtrl;
                                    scope.$apply(function() {
                                        scope.$form.$show();
                                    });
                                });
                            }
                            if (attrs.editing && scope.editing > 0) {
                                //scope.$apply(function () {
                                scope.$form.$show();
                                //});
                            }

                            //// bind click - if no external form defined
                            //if (!attrs.eForm || attrs.eClickable) {
                            //    elem.addClass('editable-click');
                            //    elem.bind(editableOptions.activationEvent, function (e) {
                            //        e.preventDefault();
                            //        e.editable = eCtrl;
                            //        scope.$apply(function () {
                            //            scope.$form.$show();
                            //        });
                            //    });
                            //}
                        }

                    }
                };
            };
        }
    ]);

    export class ForwardService {
        static $name = 'ForwardService';
        static $inject = ['$window', '$location', 'w6'];

        constructor(private $window: ng.IWindowService, private $location: ng.ILocationService, private w6: W6) {}

        public forward(url) {
            var fullUrl = this.$location.protocol() + ":" + url;
            this.forwardNaked(fullUrl);
        }

        public reload() {
            Debug.log("reloading url");
            this.$window.location.reload(true);
        }

        public forwardNaked(fullUrl) {
            Debug.log("changing URL: " + fullUrl);
            this.$window.location.href = fullUrl;
        }


        // TODO: This should rather be a task of the router...
        // e.g; add annotations to the router, and enable a default resolve on all routes to enforce it, or check on a route change etc
        // or different?
        public forceSsl() {
            if (!this.isSsl())
                throw new Tk.RequireSslException("This page requires SSL");
        }

        public forceNonSsl() {
            if (this.isSsl())
                throw new Tk.RequireNonSslException("This page requires non-SSL");
        }

        public forceSslIfPremium() {
            if (this.w6.userInfo.isPremium)
                this.forceSsl();
        }

        public forceNonSslUnlessPremium() {
            if (!this.w6.userInfo.isPremium)
                this.forceNonSsl();
        }

        public handleSsl() {
            if (this.w6.userInfo.isPremium)
                this.forceSsl();
            else
                this.forceNonSsl();
        }

        public requireSsl() {
            if (!this.isSsl()) {
                this.switchToSsl();
                return true;
            }
            return false;
        }

        public requireNonSsl() {
            if (this.isSsl()) {
                this.switchToNonSsl();
                return true;
            }
            return false;
        }

        public switchToSsl() {
            this.$window.location.href = this.$location.absUrl().replace('http', 'https').replace(":9000", ":9001");
        }


        public switchToNonSsl() {
            this.$window.location.href = this.$location.absUrl().replace('https', 'http').replace(":9001", ":9000");
        }

        public isSsl(): boolean {
            return this.$location.protocol() == 'https';
        }
    }

    registerService(ForwardService);

    /**!
 * AngularJS file upload/drop directive and service with progress and abort
 * @author  Danial  <danial.farid@gmail.com>
 * @version 4.2.4
 */
    (function() {

        var key, i;

        function patchXHR(fnName, newFn) {
            (<any>window).XMLHttpRequest.prototype[fnName] = newFn((<any>window).XMLHttpRequest.prototype[fnName]);
        }

        if ((<any>window).XMLHttpRequest && !(<any>window).XMLHttpRequest.__isFileAPIShim) {
            patchXHR('setRequestHeader', function(orig) {
                return function(header, value) {
                    if (header === '__setXHR_') {
                        var val = value(this);
                        // fix for angular < 1.2.0
                        if (val instanceof Function) {
                            val(this);
                        }
                    } else {
                        orig.apply(this, arguments);
                    }
                };
            });
        }

        var ngFileUpload = angular.module('ngFileUpload2', []);

        (<any>ngFileUpload).version = '4.2.4';
        ngFileUpload.service('Upload', [
            '$http', '$q', '$timeout', function($http, $q, $timeout) {
                function sendHttp(config) {
                    config.method = config.method || 'POST';
                    config.headers = config.headers || {};
                    config.transformRequest = config.transformRequest || function(data, headersGetter) {
                        if ((<any>window).ArrayBuffer && data instanceof (<any>window).ArrayBuffer) {
                            return data;
                        }
                        return $http.defaults.transformRequest[0](data, headersGetter);
                    };
                    var deferred = $q.defer();
                    var promise = deferred.promise;

                    config.headers['__setXHR_'] = function() {
                        return function(xhr) {
                            if (!xhr) return;
                            config.__XHR = xhr;
                            config.xhrFn && config.xhrFn(xhr);
                            xhr.upload.addEventListener('progress', function(e) {
                                e.config = config;
                                deferred.notify ? deferred.notify(e) : promise.progress_fn && $timeout(function() {
                                    promise.progress_fn(e);
                                });
                            }, false);
                            //fix for firefox not firing upload progress end, also IE8-9
                            xhr.upload.addEventListener('load', function(e) {
                                if (e.lengthComputable) {
                                    e.config = config;
                                    deferred.notify ? deferred.notify(e) : promise.progress_fn && $timeout(function() {
                                        promise.progress_fn(e);
                                    });
                                }
                            }, false);
                        };
                    };

                    $http(config).then(function(r) {
                        deferred.resolve(r);
                    }, function(e) {
                        deferred.reject(e);
                    }, function(n) {
                        deferred.notify(n);
                    });

                    promise.success = function(fn) {
                        promise.then(function(response) {
                            fn(response.data, response.status, response.headers, config);
                        });
                        return promise;
                    };

                    promise.error = function(fn) {
                        promise.then(null, function(response) {
                            fn(response.data, response.status, response.headers, config);
                        });
                        return promise;
                    };

                    promise.progress = function(fn) {
                        promise.progress_fn = fn;
                        promise.then(null, null, function(update) {
                            fn(update);
                        });
                        return promise;
                    };
                    promise.abort = function() {
                        if (config.__XHR) {
                            $timeout(function() {
                                config.__XHR.abort();
                            });
                        }
                        return promise;
                    };
                    promise.xhr = function(fn) {
                        config.xhrFn = (function(origXhrFn) {
                            return function() {
                                origXhrFn && origXhrFn.apply(promise, arguments);
                                fn.apply(promise, arguments);
                            };
                        })(config.xhrFn);
                        return promise;
                    };

                    return promise;
                }

                this.upload = function(config) {
                    config.headers = config.headers || {};
                    config.headers['Content-Type'] = undefined;
                    config.transformRequest = config.transformRequest ?
                    (angular.isArray(config.transformRequest) ?
                        config.transformRequest : [config.transformRequest]) : [];
                    config.transformRequest.push(function(data) {
                        var formData = new FormData();
                        var allFields = {};
                        for (key in config.fields) {
                            if (config.fields.hasOwnProperty(key)) {
                                allFields[key] = config.fields[key];
                            }
                        }
                        if (data) allFields['data'] = data;

                        if (config.formDataAppender) {
                            for (key in allFields) {
                                if (allFields.hasOwnProperty(key)) {
                                    config.formDataAppender(formData, key, allFields[key]);
                                }
                            }
                        } else {
                            for (key in allFields) {
                                if (allFields.hasOwnProperty(key)) {
                                    var val = allFields[key];
                                    if (val !== undefined) {
                                        if (angular.isDate(val)) {
                                            val = val.toISOString();
                                        }
                                        if (angular.isString(val)) {
                                            formData.append(key, val);
                                        } else {
                                            if (config.sendObjectsAsJsonBlob && angular.isObject(val)) {
                                                formData.append(key, new Blob([val], { type: 'application/json' }));
                                            } else {
                                                formData.append(key, JSON.stringify(val));
                                            }
                                        }

                                    }
                                }
                            }
                        }

                        if (config.file != null) {
                            var fileFormName = config.fileFormDataName || 'file';

                            if (angular.isArray(config.file)) {
                                var isFileFormNameString = angular.isString(fileFormName);
                                for (var i = 0; i < config.file.length; i++) {
                                    formData.append(isFileFormNameString ? fileFormName : fileFormName[i], config.file[i],
                                    (config.fileName && config.fileName[i]) || config.file[i].name);
                                }
                            } else {
                                formData.append(fileFormName, config.file, config.fileName || config.file.name);
                            }
                        }
                        return formData;
                    });

                    return sendHttp(config);
                };

                this.http = function(config) {
                    return sendHttp(config);
                };
            }
        ]);

        ngFileUpload.directive('ngfSelect2', [
            '$parse', '$timeout', '$compile',
            function($parse, $timeout, $compile) {
                return {
                    restrict: 'AEC',
                    require: '?ngModel',
                    link: function(scope, elem, attr, ngModel) {
                        linkFileSelect(scope, elem, attr, ngModel, $parse, $timeout, $compile);
                    }
                };
            }
        ]);

        function linkFileSelect(scope, elem, attr, ngModel, $parse, $timeout, $compile) {
            if (elem.attr('__ngf_gen__')) {
                return;
            }

            function isInputTypeFile() {
                return elem[0].tagName.toLowerCase() === 'input' && elem.attr('type') && elem.attr('type').toLowerCase() === 'file';
            }

            var isUpdating = false;

            function changeFn(evt) {
                if (!isUpdating) {
                    isUpdating = true;
                    try {
                        var fileList = evt.__files_ || (evt.target && evt.target.files);
                        var files = [], rejFiles = [];

                        for (var i = 0; i < fileList.length; i++) {
                            var file = fileList.item(i);
                            if (validate(scope, $parse, attr, file, evt)) {
                                files.push(file);
                            } else {
                                rejFiles.push(file);
                            }
                        }
                        updateModel($parse, $timeout, scope, ngModel, attr, attr.ngfChange || attr.ngfSelect, files, rejFiles, evt, null);
                        if (files.length == 0) evt.target.value = files;
                        //                if (evt.target && evt.target.getAttribute('__ngf_gen__')) {
                        //                    angular.element(evt.target).remove();
                        //                }
                    } finally {
                        isUpdating = false;
                    }
                }
            }

            function bindAttrToFileInput(fileElem) {
                if (attr.ngfMultiple) fileElem.attr('multiple', $parse(attr.ngfMultiple)(scope));
                if (!$parse(attr.ngfMultiple)(scope)) fileElem.attr('multiple', undefined);
                if (attr['accept']) fileElem.attr('accept', attr['accept']);
                if (attr.ngfCapture) fileElem.attr('capture', $parse(attr.ngfCapture)(scope));
                //        if (attr.ngDisabled) fileElem.attr('disabled', $parse(attr.disabled)(scope));
                for (var i = 0; i < elem[0].attributes.length; i++) {
                    var attribute = elem[0].attributes[i];
                    if ((isInputTypeFile() && attribute.name !== 'type')
                        || (attribute.name !== 'type' && attribute.name !== 'class' &&
                            attribute.name !== 'id' && attribute.name !== 'style')) {
                        fileElem.attr(attribute.name, attribute.value);
                    }
                }
            }

            function createFileInput(evt) {
                if (elem.attr('disabled')) {
                    return;
                }
                var fileElem = angular.element('<input type="file">');
                bindAttrToFileInput(fileElem);

                if (isInputTypeFile()) {
                    elem.replaceWith(fileElem);
                    elem = fileElem;
                    fileElem.attr('__ngf_gen__', <any>true);
                    $compile(elem)(scope);
                } else {
                    fileElem.css('visibility', 'hidden').css('position', 'absolute')
                        .css('width', '1').css('height', '1').css('z-index', '-100000')
                        .attr('tabindex', '-1');
                    if (elem.__ngf_ref_elem__) {
                        elem.__ngf_ref_elem__.remove();
                    }
                    elem.__ngf_ref_elem__ = fileElem;
                    document.body.appendChild(fileElem[0]);
                }

                return fileElem;
            }

            function resetModel(evt) {
                updateModel($parse, $timeout, scope, ngModel, attr, attr.ngfChange || attr.ngfSelect, [], [], evt, true);
            }

            function clickHandler(evt) {
                if (evt != null) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
                var fileElem = createFileInput(evt);
                if (fileElem) {
                    fileElem.bind('change', changeFn);
                    if (evt) {
                        resetModel(evt);
                    }

                    function clickAndAssign(evt) {
                        if (evt != null) {
                            fileElem[0].click();
                        }
                        if (isInputTypeFile()) {
                            elem.bind('click touchend', clickHandler);
                        }
                    }

                    // fix for android native browser
                    if (navigator.userAgent.toLowerCase().match(/android/)) {
                        setTimeout(function() {
                            clickAndAssign(evt);
                        }, 0);
                    } else {
                        clickAndAssign(evt);
                    }
                }
                return false;
            }

            if ((<any>window).FileAPI && (<any>window).FileAPI.ngfFixIE) {
                (<any>window).FileAPI.ngfFixIE(elem, createFileInput, bindAttrToFileInput, changeFn, resetModel);
            } else {
                clickHandler(null);
                if (!isInputTypeFile()) {
                    elem.bind('click touchend', clickHandler);
                }
            }
        }

        ngFileUpload.directive('ngfDrop2', [
            '$parse', '$timeout', '$location', function($parse, $timeout, $location) {
                return {
                    restrict: 'AEC',
                    require: '?ngModel',
                    link: function(scope, elem, attr, ngModel) {
                        linkDrop(scope, elem, attr, ngModel, $parse, $timeout, $location);
                    }
                };
            }
        ]);

        ngFileUpload.directive('ngfNoFileDrop2', function() {
            return function(scope, elem) {
                if (dropAvailable()) elem.css('display', 'none');
            };
        });

        ngFileUpload.directive('ngfDropAvailable2', [
            '$parse', '$timeout', function($parse, $timeout) {
                return function(scope, elem, attr) {
                    if (dropAvailable()) {
                        var fn = $parse(attr.ngfDropAvailable);
                        $timeout(function() {
                            fn(scope);
                            if (fn.assign) {
                                fn.assign(scope, true);
                            }
                        });
                    }
                };
            }
        ]);

        function linkDrop(scope, elem, attr, ngModel, $parse, $timeout, $location) {
            var available = dropAvailable();
            if (attr.dropAvailable) {
                $timeout(function() {
                    scope[attr.dropAvailable] ? scope[attr.dropAvailable].value = available : scope[attr.dropAvailable] = available;
                });
            }
            if (!available) {
                if ($parse(attr.ngfHideOnDropNotAvailable)(scope) == true) {
                    elem.css('display', 'none');
                }
                return;
            }
            var leaveTimeout = null;
            var stopPropagation = $parse(attr.ngfStopPropagation);
            var dragOverDelay = 1;
            var accept = $parse(attr.ngfAccept);
            var actualDragOverClass;

            elem[0].addEventListener('dragover', function(evt) {
                if (elem.attr('disabled')) return;
                evt.preventDefault();
                if (stopPropagation(scope)) evt.stopPropagation();
                // handling dragover events from the Chrome download bar
                if (navigator.userAgent.indexOf("Chrome") > -1) {
                    var b = evt.dataTransfer.effectAllowed;
                    evt.dataTransfer.dropEffect = ('move' === b || 'linkMove' === b) ? 'move' : 'copy';
                }
                $timeout.cancel(leaveTimeout);
                if (!scope.actualDragOverClass) {
                    actualDragOverClass = calculateDragOverClass(scope, attr, evt);
                }
                elem.addClass(actualDragOverClass);
            }, false);
            elem[0].addEventListener('dragenter', function(evt) {
                if (elem.attr('disabled')) return;
                evt.preventDefault();
                if (stopPropagation(scope)) evt.stopPropagation();
            }, false);
            elem[0].addEventListener('dragleave', function() {
                if (elem.attr('disabled')) return;
                leaveTimeout = $timeout(function() {
                    elem.removeClass(actualDragOverClass);
                    actualDragOverClass = null;
                }, dragOverDelay || 1);
            }, false);
            elem[0].addEventListener('drop', function(evt) {
                if (elem.attr('disabled')) return;
                evt.preventDefault();
                if (stopPropagation(scope)) evt.stopPropagation();
                elem.removeClass(actualDragOverClass);
                actualDragOverClass = null;
                extractFiles(evt, function(files, rejFiles) {
                    updateModel($parse, $timeout, scope, ngModel, attr,
                        attr.ngfChange || attr.ngfDrop, files, rejFiles, evt, null);
                }, $parse(attr.ngfAllowDir)(scope) != false, attr.multiple || $parse(attr.ngfMultiple)(scope));
            }, false);

            function calculateDragOverClass(scope, attr, evt) {
                var accepted = true;
                var items = evt.dataTransfer.items;
                if (items != null) {
                    for (var i = 0; i < items.length && accepted; i++) {
                        accepted = accepted
                            && (items[i].kind == 'file' || items[i].kind == '')
                            && validate(scope, $parse, attr, items[i], evt);
                    }
                }
                var clazz = $parse(attr.ngfDragOverClass)(scope, { $event: evt });
                if (clazz) {
                    if (clazz.delay) dragOverDelay = clazz.delay;
                    if (clazz.accept) clazz = accepted ? clazz.accept : clazz.reject;
                }
                return clazz || attr.ngfDragOverClass || 'dragover';
            }

            function extractFiles(evt, callback, allowDir, multiple) {
                var files = [], rejFiles = [], items = evt.dataTransfer.items, processing = 0;

                function addFile(file) {
                    if (validate(scope, $parse, attr, file, evt)) {
                        files.push(file);
                    } else {
                        rejFiles.push(file);
                    }
                }

                if (items && items.length > 0 && $location.protocol() != 'file') {
                    var f2 = evt.dataTransfer.getData('text/uri-list');

                    if (f2 != null && f2 != "") {
                        addFile(f2);
                    }

                    for (var i = 0; i < items.length; i++) {
                        if (items[i].webkitGetAsEntry && items[i].webkitGetAsEntry() && items[i].webkitGetAsEntry().isDirectory) {
                            var entry = items[i].webkitGetAsEntry();
                            if (entry.isDirectory && !allowDir) {
                                continue;
                            }
                            if (entry != null) {
                                traverseFileTree(files, entry, null);
                            }
                        } else {
                            var f = items[i].getAsFile();
                            if (f != null) addFile(f);
                        }
                        if (!multiple && files.length > 0) break;
                    }
                } else {
                    var fileList = evt.dataTransfer.files;
                    if (fileList != null) {
                        for (var i = 0; i < fileList.length; i++) {
                            addFile(fileList.item(i));
                            if (!multiple && files.length > 0) break;
                        }
                    }
                }
                var delays = 0;
                (function waitForProcess(delay) {
                    $timeout(function() {
                        if (!processing) {
                            if (!multiple && files.length > 1) {
                                i = 0;
                                while (files[i].type == 'directory') i++;
                                files = [files[i]];
                            }
                            callback(files, rejFiles);
                        } else {
                            if (delays++ * 10 < 20 * 1000) {
                                waitForProcess(10);
                            }
                        }
                    }, delay || 0);
                })(null);

                function traverseFileTree(files, entry, path) {
                    if (entry != null) {
                        if (entry.isDirectory) {
                            var filePath = (path || '') + entry.name;
                            addFile({ name: entry.name, type: 'directory', path: filePath });
                            var dirReader = entry.createReader();
                            var entries = [];
                            processing++;
                            var readEntries = function() {
                                dirReader.readEntries(function(results) {
                                    try {
                                        if (!results.length) {
                                            for (var i = 0; i < entries.length; i++) {
                                                traverseFileTree(files, entries[i], (path ? path : '') + entry.name + '/');
                                            }
                                            processing--;
                                        } else {
                                            entries = entries.concat(Array.prototype.slice.call(results || [], 0));
                                            readEntries();
                                        }
                                    } catch (e) {
                                        processing--;
                                        Tk.Debug.error(e);
                                    }
                                }, function() {
                                    processing--;
                                });
                            };
                            readEntries();
                        } else {
                            processing++;
                            entry.file(function(file) {
                                try {
                                    processing--;
                                    file.path = (path ? path : '') + file.name;
                                    addFile(file);
                                } catch (e) {
                                    processing--;
                                    Tk.Debug.error(e);
                                }
                            }, function() {
                                processing--;
                            });
                        }
                    }
                }
            }
        }

        ngFileUpload.directive('ngfSrc2', [
            '$parse', '$timeout', function($parse, $timeout) {
                return {
                    restrict: 'AE',
                    link: function(scope, elem, attr, file) {
                        if ((<any>window).FileReader) {
                            scope.$watch(attr.ngfSrc, function(file) {
                                if (file &&
                                    validate(scope, $parse, attr, file, null) &&
                                    (!(<any>window).FileAPI || navigator.userAgent.indexOf('MSIE 8') === -1 || file.size < 20000) &&
                                    (!(<any>window).FileAPI || navigator.userAgent.indexOf('MSIE 9') === -1 || file.size < 4000000)) {
                                    $timeout(function() {
                                        //prefer URL.createObjectURL for handling refrences to files of all sizes
                                        //since it doesn´t build a large string in memory
                                        var URL = (<any>window).URL || (<any>window).webkitURL;
                                        if (URL && URL.createObjectURL) {
                                            elem.attr('src', URL.createObjectURL(file));
                                        } else {
                                            var fileReader = new FileReader();
                                            fileReader.readAsDataURL(file);
                                            fileReader.onload = function(e) {
                                                $timeout(function() {
                                                    elem.attr('src', (<any>e).target.result);
                                                });
                                            };
                                        }
                                    });
                                } else {
                                    elem.attr('src', attr.ngfDefaultSrc || '');
                                }
                            });
                        }
                    }
                };
            }
        ]);

        function dropAvailable() {
            var div = document.createElement('div');
            return ('draggable' in div) && ('ondrop' in div);
        }

        function updateModel($parse, $timeout, scope, ngModel, attr, fileChange, files, rejFiles, evt, noDelay) {
            function update() {
                if (ngModel) {
                    $parse(attr.ngModel).assign(scope, files);
                    $timeout(function() {
                        ngModel && ngModel.$setViewValue(files != null && files.length == 0 ? null : files);
                    });
                }
                if (attr.ngModelRejected) {
                    $parse(attr.ngModelRejected).assign(scope, rejFiles);
                }
                if (fileChange) {
                    $parse(fileChange)(scope, {
                        $files: files,
                        $rejectedFiles: rejFiles,
                        $event: evt
                    });

                }
            }

            if (noDelay) {
                update();
            } else {
                $timeout(function() {
                    update();
                });
            }
        }

        function validate(scope, $parse, attr, file, evt) {
            var accept = $parse(attr.ngfAccept)(scope, { $file: file, $event: evt });
            var fileSizeMax = $parse(attr.ngfMaxSize)(scope, { $file: file, $event: evt }) || 9007199254740991;
            var fileSizeMin = $parse(attr.ngfMinSize)(scope, { $file: file, $event: evt }) || -1;
            if (accept != null && angular.isString(accept)) {
                var regexp = new RegExp(globStringToRegex(accept), 'gi');
                accept = (file.type != null && regexp.test(file.type.toLowerCase())) ||
                (file.name != null && regexp.test(file.name.toLowerCase()));
            }
            return (accept == null || accept) && (file.size == null || (file.size < fileSizeMax && file.size > fileSizeMin));
        }

        function globStringToRegex(str) {
            if (str.length > 2 && str[0] === '/' && str[str.length - 1] === '/') {
                return str.substring(1, str.length - 1);
            }
            var split = str.split(','), result = '';
            if (split.length > 1) {
                for (var i = 0; i < split.length; i++) {
                    result += '(' + globStringToRegex(split[i]) + ')';
                    if (i < split.length - 1) {
                        result += '|';
                    }
                }
            } else {
                if (str.indexOf('.') == 0) {
                    str = '*' + str;
                }
                result = '^' + str.replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + '-]', 'g'), '\\$&') + '$';
                result = result.replace(/\\\*/g, '.*').replace(/\\\?/g, '.');
            }
            return result;
        }

    })();

}
