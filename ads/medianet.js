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
    'timeout',
    'misc',
    'categoryExclusions',
    'tagForChildDirectedTreatment',
    'cookieOptions',
    'overrideWidth',
    'overrideHeight',
    'loadingStrategy',
    'consentNotificationId',
    'useSameDomainRenderingUntilDeprecated',
    'experimentId',
    // 'multiSize',TODO
    // 'multiSizeValidation',
  ],
  dfpParams = ['slot',
    'targeting',
    'categoryExclusions',
    'tagForChildDirectedTreatment',
    'cookieOptions',
    'overrideWidth',
    'overrideHeight',
    'loadingStrategy',
    'consentNotificationId',
    'useSameDomainRenderingUntilDeprecated',
    'experimentId',
    // 'multiSize',TODO
    // 'multiSizeValidation',
  ],
  dfpDefaultTimeout = 1000;

/**
 * @param {!Window} global
 * @param {!Object} data
 */
export function medianet(global, data) {
  validateData(data, mandatoryParams, optionalParams);

  if (!data.requrl) {
    data.requrl = global.context.canonicalUrl ||
      getSourceUrl(global.context.location.href);
  }

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
  let url = 'https://contextual-stage.media.net/ampnmedianet.js?';
  url += 'cid=' + encodeURIComponent(data.cid);
  url += '&https=1';
  url += '&requrl=' + encodeURIComponent(data.requrl);
  if (global.context.referrer) {
    url += '&refurl=' + encodeURIComponent(global.context.referrer);
    global.medianet_refurl = global.context.referrer;
  }
  if (data.misc) {
    try {
      global.medianet_misc = JSON.parse(data.misc);
    } catch (e) {
      global.medianet_misc = data.misc;
    }
  }
  setMacro(data, 'versionId');
  setMacro(data, 'requrl');
  setMacro(data, 'width');
  setMacro(data, 'height');
  setMacro(data, 'crid');
  setCallbacks(global);
  writeScript(global, url);
}

/**
 * @param {!Window} global
 * @param {!Object} data
 */
function loadHBTag(global, data) {

  function deleteUnexpectedDoubleclickParams() {
    const allParams = mandatoryParams.concat(optionalParams);
    let currentParam = '';
    for (let i = 0; i < allParams.length; i++) {
      currentParam = allParams[i];
      if (dfpParams.indexOf(currentParam) === -1 && data[currentParam]) {
        delete data[currentParam];
      }
    }
  }

  let isDoubleClickCalled = false;
  function loadDFP() {
    if (isDoubleClickCalled) {
      return;
    }
    isDoubleClickCalled = true;

    if (global.advBidxc && typeof global.advBidxc.renderAmpAd === 'function') {
      global.addEventListener('message', function (event) {
          global.advBidxc.renderAmpAd(event, global);
      });
    }

    data.targeting = data.targeting || {};

    if (global.advBidxc && typeof global.advBidxc.setTargeting === 'function') {
      global.advBidxc.setTargeting(data);
    }
    deleteUnexpectedDoubleclickParams();
    doubleclick(global, data);
  }

  function mnetHBHandle() {
    global.advBidxc = global.context.master.advBidxc;
    if (global.advBidxc && typeof global.advBidxc.registerAmpSlot === 'function') {
      global.advBidxc.registerAmpSlot({
        cb: loadDFP,
        data,
        winObj: global,
      });
    }
  }

  global.setTimeout(function() {
    loadDFP();
  }, data.timeout || dfpDefaultTimeout);

  computeInMasterFrame(global, 'mnet-hb-load', function(done) {
    global.advBidxc_requrl = data.requrl;
    writeScript(global, 'http://cmlocal.media.net/bidexchange.php?amp=1&cid=' + data.cid, () => {
      done();
    });
  }, mnetHBHandle);
}
function setMacro(data, type, name) {
  if (!type || !data) {
    return;
  }
  name = name || type;
  name = 'medianet_' + name;
  if (data[type]) {
    global[name] = data[type];
  }
}

function setCallbacks(global) {
  function renderStartCb(opt_data) {
    console.log('renderStartCalled');
    global.context.renderStart(opt_data);
  }
  function reportRenderedEntityIdentifierCb(ampId) {
    console.log('reported rendered entity' + ampId);
    global.context.reportRenderedEntityIdentifier(ampId);
  }
  function noContentAvailableCb() {
    console.log('no content available called');
    global.context.noContentAvailable();
  }

  const callbacks = {
    renderStartCb,
    reportRenderedEntityIdentifierCb,
    noContentAvailableCb,
  };
  global._mNAmp = callbacks;

}
