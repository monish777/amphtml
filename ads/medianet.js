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

import {writeScript, validateData, computeInMasterFrame} from '../3p/3p';
import {getSourceUrl} from '../src/url';
import {doubleclick} from '../ads/google/doubleclick';

const mandatoryParams = ['tagType', 'cid'],
  optionalParams = ['slot',
      'position',
      'targeting',
      'crid',
      'versionId',
      'requrl',
    ],
  dfpParams = ['slot', 'targeting'],
  dfpDefaultTimeout = 3000;

let startTime;
/**
 * @param {!Window} global
 * @param {!Object} data
 */
export function medianet(global, data) {
  validateData(data, mandatoryParams, optionalParams);

  data.requrl = data.requrl || global.context.canonicalUrl || getSourceUrl(global.context.location.href);

  if (data.tagType === 'hb') {
    loadHBTag(global, data);
  } else if (data.tagType === 'sync') {
    loadSyncTag(global, data);
  }
}

/**
 * @param {!Window} global
 * @param {!Object} data
 */
function loadSyncTag(global, data) {
  /*eslint "google-camelcase/google-camelcase": 0*/
  if (!data.crid) {
    return;
  }
  if (data.versionId) {
    global.medianet_versionId = data.versionId;
  }
  global.medianet_requrl = data.requrl;
  global.medianet_width = data.width;
  global.medianet_height = data.height;
  global.medianet_crid = data.crid;

  writeScript(global, 'https://contextual-stage.media.net/ampnmedianet.js?cid=' + encodeURIComponent(data.cid) + '&https=1');
}

/**
 * @param {!Window} global
 * @param {!Object} data
 */
function loadHBTag(global, data) {
    if (!data.slot || !data.position) {
        return;
    }

    let gptran = false;
    function loadDFP() {
        function deleteUnexpectedDoubleclickParams() {
            const allParams = mandatoryParams.concat(optionalParams);
            let currentParam = '';
            for (let i=0; i < allParams.length; i++) {
                currentParam = allParams[i];
                if (dfpParams.indexOf(currentParam) === -1 && data[currentParam]) {
                    delete data[currentParam];
                }
            }
        }
        if (gptran) {
            return;
        }
        gptran = true;

        if (global.advBidxc && typeof global.advBidxc.renderAmpAd === "function") {
            global.addEventListener("message", global.advBidxc.renderAmpAd);
        } else {
            console.error('renderAmpAd function not found', global.advBidxc);   //global.advBidxc logged just to make sure if we have access to our bidexchange object
        }

        data.targeting = data.targeting || {};

        deleteUnexpectedDoubleclickParams();
        doubleclick(global, data);
    }

    function mnetHBHandle() {
        global.advBidxc = global.context.master.advBidxc;
        if (typeof global.advBidxc.handleAMPHB === "function") {
            global.advBidxc.handleAMPHB({
                cb: loadDFP,
                data: data,
                winObj: global
            });
        }
    }

    global.setTimeout(function () {
        loadDFP();
    }, dfpDefaultTimeout);

    computeInMasterFrame (global, 'mnet-hb-load', function (done) {
        global.advBidxc_requrl = data.requrl;
        writeScript(global, 'http://cmlocal.media.net/bidexchange.php?amp=1&cid=' + data.cid, () => {
            done();
        });
    }, mnetHBHandle);
}
