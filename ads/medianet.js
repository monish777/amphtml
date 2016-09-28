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
    function loadDFP(result) {
        console.log('load dfp called', result);
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

        global.advBidxc = global.context.master.advBidxc;
        data.targeting = data.targeting || global.advBidxc.getMnetTargetingMap(data.position);  //todo-check if getMnetTargetingMap is a function
        //&mnetbidID=99&mnetbidderID=mnet&mnetbidPrice=6.50&mnet_placement=rec&mnetAct=headerBid&mnetScpvid=&mnetTd=%257Cadx%253D1%257C
        data.targeting.mnTest = '1'; //todo- test
        data.targeting.mnet = '1';

        data.useSameDomainRenderingUntilDeprecated = 1;
        deleteUnexpectedDoubleclickParams();  //Todo: Should change data.type = 'doubleclick'?
        doubleclick(global, data);
    }

    computeInMasterFrame (global, 'mnet-hb-load', function (done) {
        writeScript(global, 'http://cmlocal.media.net/bidexchange.php?cid=' + data.cid, () => { //todo change to live later
            console.log('Bid exchange loaded');
            var result = 'Temporary result';
            window.setTimeout(done(result), 1000); //rubicontag.run(gptrun, 1000);
        });
    }, loadDFP);
}

