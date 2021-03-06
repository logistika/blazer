
const { create_bucket, list_buckets,
        delete_bucket, update_bucket,
        list_file_names, list_file_versions } = require('./buckets');
const { get_upload_url, upload_file, get_file_info, hide_file,
        delete_file_version } = require('./file');
const { authorize_account } = require('./authorize_account');
const { createSessionHandler } = require('./sessionUtil');

/**
 * Token object here contains
  "accountId", "apiUrl", "authorizationToken", "downloadUrl"
 */
const createB2 = (token) => {

    if ( !token || !token.accountId || !token.apiUrl ||
            !token.authorizationToken || !token.downloadUrl ) {
        throw new Error('Invalid token object as argument.' , token);
    }
    const api = {
        create_bucket: create_bucket(token),
        list_buckets: list_buckets(token),
        get_upload_url: get_upload_url(token),
        upload_file,
        hide_file: hide_file(token),
        delete_file_version: delete_file_version(token),
        get_file_info: get_file_info(token),
        list_file_versions: list_file_versions(token),
        delete_bucket: delete_bucket(token),
        update_bucket: update_bucket(token),
        list_file_names: list_file_names(token)
    };
    return api;
};

const { keys } = Object;

const slackerFunc = () => {
    throw new Error('this is not yet implemented');
};

const apis = {
    create_bucket,
    list_buckets,
    get_upload_url,
    upload_file,
    delete_bucket,
    update_bucket,
    list_file_names,
    list_file_versions,
    get_file_info,
    hide_file,
    delete_file_version,
    cancel_large_file: slackerFunc,
    download_file_by_id: slackerFunc,
    download_file_by_name: slackerFunc,
    finish_large_file: slackerFunc,
    get_upload_part_url: slackerFunc,
    list_parts: slackerFunc,
    list_unfinished_large_files: slackerFunc,
    start_large_file: slackerFunc,
    upload_part:  slackerFunc
};


const createMemoryStore = () => {
    var token;
    //var bucketUploadTokens = {};

    return {
        token() {
            return token;
        },
        persistToken(newToken) {
            token = newToken;
            return Promise.resolve(newToken);
        },
        invalidate() {
            token = undefined;
        }
        // bucketToken(bucketId, newToken) {
        //     if ( bucketId && newToken ) {
        //         bucketUploadTokens[bucketId] = newToken;
        //     }
        //     return bucketUploadTokens[bucketId];
        // }
    };
};

const createB2Session = ( { accountId, applicationKey }, config = {} ) => {

    var store = config.store || createMemoryStore();
    const api = {
        //if forced is true, then we retrieve a new token
        ready(forced) {
            if ( forced ) {
                store.invalidate();
            }
            if ( !store.token() ) {
                console.log('retrieving token...');
                return api.authorize_account(accountId, applicationKey).then( newToken => {
                    return store.persistToken(newToken);
                },  err => {
                    console.log('error: ', err);
                    throw new Error(err);
                });
            } else {
                return Promise.resolve(store.token());
            }
        },

        authorize_account

    };
    keys(apis).forEach( key => {
        //just incase
        if ( key !== 'authorize_account' ) {
            if ( api[key] ) {
                throw new Error(key + ' is already a function in api');
            }
            api[key] = createSessionHandler( { api, store, apiCall: apis[key], name: key, debug: config.debug } );
        }
    });

    return api;
};


module.exports = {
    createB2,
    authorize_account,
    createB2Session
};
