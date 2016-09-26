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
import {doubleclick} from '../ads/google/doubleclick';

const mandatoryParams = ['tagType', 'cid'],
    optionalParams = ['slot', 'position', 'targeting', 'crid', 'versionId', 'requrl'], //We can mandate slot and position incase tagType=hb and similarly crid in case of CM
    dfpParams = ['slot', 'targeting'];  // These Won't be deleted before sending to dfp

/**
 * @param {!Window} global
 * @param {!Object} data
 */
export function medianet(global, data) {
    try {
        validateData(data, mandatoryParams, optionalParams);
    } catch (e) {
        console.log('We can log missing attributes here');
        console.log(e);
    }

    //Playing with the data
    data.requrl = data.requrl || getSourceUrl(context.location.href);
    //Ends here

    if (data.tagType === 'hb') {
        loadHBTag(global, data)
    } else if ( data.tagType === 'sync') {
        loadSyncTag(global, data);
    }
}

/**
 * @param {!Window} global
 * @param {!Object} data
 */
function loadSyncTag(global, data) {
    if (data.versionId) {
        global.medianet_versionId = data.versionId;
    }
    global.medianet_requrl = data.requrl;
    global.medianet_width = data.width;
    global.medianet_height = data.height;
    global.medianet_crid = data.crid;

    writeScript(global, 'https://contextual.media.net/nmedianet.js?cid='+ encodeURIComponent(data.cid) +'&https=1');


}



function loadHBTag(global, data) {
    //validateData(data, mandatoryParams, optionalParams);

    global.mnetAmpProject = true; //rubicontag.setIntegration('amp');
    global.advBidxc_requrl = context.location.href; //rubicontag.setUrl(getSourceUrl(context.location.href));Todo should be here or in amp-manager?
    console.log('Data received', data);

    let gptran = false;
    function loadDFP() {
        console.log('load dfp called');
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
            return;
        }
        gptran = true;

        // let ASTargeting = rubicontag.getSlot('c').getAdServerTargeting();
        // const ptrn = /rpfl_\d+/i;
        // for (let i = 0; i < ASTargeting.length; i++) {
        //   if (ptrn.test(ASTargeting[i].key)) {
        //     ASTargeting = ASTargeting[i].values;
        //   }
        // }
        // if (!data.targeting) { data.targeting = {}; }
        // data.targeting['rpfl_' + data.account] = ASTargeting;
        // data.targeting['rpfl_elemid'] = 'c';

        data.targeting = data.targeting || global.advBidxc.getMnetTargetingMap(data.position);
        deleteUnexpectedDoubleclickParams();  //Todo: Should change data.type = 'doubleclick'?
        doubleclick(global, data);
    }

    writeScript(global, 'http://cmlocal.media.net/bidexchange.php?cid=' + data.cid, () => {
        console.log('Bid exchange loaded');
        window.setTimeout(loadDFP, 1000); //rubicontag.run(gptrun, 1000);
    });
}

