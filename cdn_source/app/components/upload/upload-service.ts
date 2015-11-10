module MyApp.Components.Upload {

// ReSharper disable InconsistentNaming
    export interface IAWSUploadPolicy {
        AccessKey: string;
        Signature: string;
        SecurityToken: string;
        ACL: string;
        ContentType: string;
        Key: string;
        BucketName: string;
        EncryptedPolicy: string;
        CallbackUrl: string;
    }

// ReSharper restore InconsistentNaming

    export class UploadService extends Tk.Service {
        static $name = 'UploadService';
        static $inject = ['$http', '$upload', 'options', 'dbContext'];

        constructor(private $http, private $upload, private options, private context) {
            super();
        }

        public uploadToAmazon(file: File, authorizationPath, policyType, requestName?) {
            throw Error("Not Implemented");
            this.getPolicy(file, authorizationPath, policyType, requestName)
                .success(s3Params => this.uploadToBucket(file, s3Params, requestName));
        }

        public uploadToAmazonWithPolicy(file: File, uploadPolicy: IBreezeAWSUploadPolicy): ng.IHttpPromise<any> {
            return this.uploadToBucket(file, uploadPolicy);

        }

        private getPolicy(file, authorizationPath, policyType, requestName?) {
            return this.context.getCustom(this.options.serviceName + '/' + authorizationPath, { requestName: requestName, params: { policyType: policyType, filePath: file } });
        }

        private uploadToBucket = (file: File, s3Params: IBreezeAWSUploadPolicy, requestName?): ng.IHttpPromise<any> => {
            var data = {
                key: s3Params.key,
                acl: s3Params.aCL, // ?? acl vs CannedACL ?
                //success_action_redirect: s3Params.callbackUrl,
                'Content-Type': s3Params.contentType,
                'x-amz-security-token': s3Params.securityToken,
                AWSAccessKeyId: s3Params.accessKey, // ?? included in policy?
                Policy: jQuery.parseJSON(s3Params.encryptedPolicy).policy, // TODO: We actually really only need the policy property??
                Signature: s3Params.signature,
                //filename: file.name, // ?? included in policy?
                //filename: file.name //Required for IE8/9 //,
            };
/*
            if (s3Params.callbackUrl) {

                data.success_action_redirect = s3Params.callbackUrl;
                //data.success_action_status = '201';
            }
*/

            return this.$upload.upload({
                url: 'https://' + s3Params.bucketName + '.s3.amazonaws.com/',
                method: 'POST',
                data: data,
                file: file,
            });
            //.progress(evt => {
            //Debug.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
            //}).success((data, status, headers, config) => {
            // file is uploaded successfully
            //Debug.log(data);
            //});
            //.error(...)
            //.then(success, error, progress); 
            // access or attach event listeners to the underlying XMLHttpRequest.
            //.xhr(function(xhr){xhr.upload.addEventListener(...)})
        };
    }

    registerService(UploadService);
}