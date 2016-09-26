/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {writeScript, validateData} from '../3p/3p';
import {getSourceUrl} from '../src/url';

/**
 * @param {!Window} global
 * @param {!Object} data
 */
export function medianet(global, data) {
    validateData(data, ['tagType', 'crid', 'cid'], ['versionId', 'requrl']);


    if (data.tagType ==='hb') {

    } else if ( data.tagType === 'sync') {
        loadSyncTag(global, data);
    } else {
        loadAsyncAdtag(global, data);
    }
}

/**
 * @param {!Window} global
 * @param {!Object} data
 */
function loadSyncTag(global, data) {
    const pageURL = getSourceUrl(context.location.href);
    if (data.versionId) {
        global.medianet_versionId = data.versionId;
    }
    global.medianet_requrl = data.requrl || pageURL;
    global.medianet_width = data.width;
    global.medianet_height = data.height;
    global.medianet_crid = data.crid;


    writeScript(global, 'https://contextual.media.net/nmedianet.js?cid='+ encodeURIComponent(data.cid) +'&https=1');


}

/**
 * @param {!Window} global
 * @param {!Object} data
 */
function loadAsyncAdtag(global, data) {
    const pageURL = getSourceUrl(context.location.href);
    global._mNHandle = global._mNHandle || {};
    global._mNHandle.queue = global._mNHandle.queue || [];

    writeScript(global, 'https://contextual.media.net/dmedianet.js?cid=' + encodeURIComponent(data.cid)+ '&https=1');

    if (data.versionId) {
        global.medianet_versionId = data.versionId;
    }
    global.medianet_requrl = data.requrl || pageURL;
    const div = global.document.createElement('div');
    let size = data.width + 'x' + data.height;
    div.id = data.crid;
    global.document.body.appendChild(div);
    try {
        global._mNHandle.queue.push(function () {
            global._mNDetails.loadTag(data.crid, size, data.crid);
        });
    }
    catch (error) {}
}




