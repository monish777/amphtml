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

const mandatoryParams = ['tagType', 'cid'], //Todo Should I keep cid as mandatory
  optionalParams = ['slot',
      'position',
      'targeting',
      'crid',
      'versionId',
      'requrl',
    ], //We can mandate slot and position incase tagType=hb and similarly crid in case of CM
  dfpParams = ['slot', 'targeting'],  // These Won't be deleted before sending to dfp
  dfpDefaultTimeout = 300;    //Todo Correct?

let startTime;
/**
 * @param {!Window} global
 * @param {!Object} data
 */
export function medianet(global, data) {
    startTime = new Date().getTime();
    console.log('Mnet third party amp ad called', window.context.container, new Date().getTime() - global.context.master.masterStartTime);
    console.log('Is Master? ', global.context.isMaster);
    try {
        validateData(data, mandatoryParams, optionalParams);
    } catch (e) {
        console.log('We can log missing attributes here');  //We must because if a param is missing only in the master frame, then all our ads on the page will be affected
        console.log(e);
    }

  data.requrl = data.requrl || getSourceUrl(window.context.canonicalUrl)
      || getSourceUrl(context.location.href);
    //Ends here

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
    console.error('Slot and position undefined');
    return;
  }

  let gptran = false;
  function loadDFP() {
    console.log('load dfp called', new Date().getTime() - global.context.master.masterStartTime, global.context.isMaster);
    function deleteUnexpectedDoubleclickParams() {
      var allParams = mandatoryParams.concat(optionalParams),
          currentParam = '';
      for (var i=0; i < allParams.length; i++) {
        currentParam = allParams[i];
        if (dfpParams.indexOf(currentParam) === -1 && data[currentParam]) {
          delete data[currentParam];
        }
      }
    }
    if (gptran) {
      console.log('Gpt ran already', global.context.isMaster, data.targeting);
      return;
    }
    gptran = true;

    if (global.advBidxc && typeof global.advBidxc.renderAmpAd === "function") {
      global.addEventListener("message", global.advBidxc.renderAmpAd);   //Todo cross-browser?
    } else {
      console.error('renderAmpAd function not found', global.advBidxc);   //global.advBidxc logged just to make sure if we have access to our bidexchange object
    }

    data.targeting = data.targeting || {};

    deleteUnexpectedDoubleclickParams();  //Todo: Should change data.type = 'doubleclick'?
    console.log('Calling double click', new Date().getTime() - global.context.master.masterStartTime, global.context.isMaster);
    doubleclick(global, data);
  }

  function mnetHBHandle() {
    console.log('IN mnetHBHandle', global.context.isMaster);
    global.advBidxc = global.context.master.advBidxc;
    if (typeof global.advBidxc.handleAMPHB === "function") {
      global.advBidxc.handleAMPHB({
        cb: loadDFP,
        data: data,
        winObj: global
      });
    } else {
      console.error('Mnet Error: handleAMPHB function not found');
    }
  }
  //
  // function mnetHBTimeout() {
  //     console.log('IN mnetHBTimeout', global.context.isMaster);
  //     global.advBidxc = global.context.master.advBidxc;
  //     if (typeof global.advBidxc.handleAMPHB === "function") {
  //         global.advBidxc.handleAMPHBTimeout({
  //             cb: loadDFP,
  //             data: data,
  //             winObj: global
  //         });
  //     } else {
  //         console.error('Mnet Error: handleAMPHBTimeout function not found');
  //     }
  // }

  global.setTimeout(function () { //TODO M1; Clear timeout
    loadDFP();
  }, 10000);

  computeInMasterFrame (global, 'mnet-hb-load', function (done) {
    global.advBidxc_requrl = data.requrl;
    global.masterStartTime = startTime;
    console.log('Computing in master frame', new Date().getTime() - global.context.master.masterStartTime);
    writeScript(global, 'http://cmlocal.media.net/bidexchange.php?amp=1&cid=' + data.cid, () => { //todo M1 change to live later; Can we have a timeout for bidexchange to respond (Check cmlocal on wifi)
      console.log('Bid exchange loaded', new Date().getTime() - global.context.master.masterStartTime);
      done();
      //Once master script gets executed and done gets called, if some amp-ad located deep below the page gets called when the user scrolls down, its loadDFP copy gets called almost immediately(approx 10ms).
      //In child frames, the done copy(along with the parameters) that was called most recently from master gets called --> Screenshot AMP1
    });
  }, mnetHBHandle);
}

