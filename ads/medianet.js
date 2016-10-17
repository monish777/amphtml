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
    optionalParams = ['slot', 'position', 'targeting', 'crid', 'versionId', 'requrl'], //We can mandate slot and position incase tagType=hb and similarly crid in case of CM
    dfpParams = ['slot', 'targeting'],  // These Won't be deleted before sending to dfp
    dfpDefaultTimeout = 300;    //Todo Correct?

var startTime;
/**
 * @param {!Window} global
 * @param {!Object} data
 */
export function medianet(global, data) {
    startTime = new Date().getTime();
    console.log('Mnet third party amp ad called', new Date().getTime() - global.context.master.masterStartTime);
    console.log('Is Master? ', global.context.isMaster);
    try {
        validateData(data, mandatoryParams, optionalParams);
    } catch (e) {
        console.log('We can log missing attributes here');  //We must because if a param is missing only in the master frame, then all our ads on the page will be affected
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
    if (!data.crid) {
        return;
    }
    if (data.versionId) {
        global.medianet_versionId = data.versionId;
    }
    global.medianet_requrl = data.requrl;
    global.medianet_width = data.width;
    global.medianet_height = data.height;
    global.medianet_crid = data.crid;   //Todo-What if crid is not present

    writeScript(global, 'https://contextual-stage.media.net/ampnmedianet.js?cid='+ encodeURIComponent(data.cid) +'&https=1');
}

function loadHBTag(global, data) {
    global.advBidxc_requrl = data.requrl + '&force_hbtest=1';   //Todo-This can be done in master frame only
    //validateData(data, mandatoryParams, optionalParams);  //Todo-We should probably mandate slot and position here

    console.log('HB Data received', data, new Date().getTime() - global.context.master.masterStartTime, global.context.isMaster);

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
            console.log('Gpt ran already', global.context.isMaster);
            return;
        }
        gptran = true;

        global.advBidxc = global.context.master.advBidxc;
        global.addEventListener("message", global.advBidxc.renderAmpAd);   //Todo cross-browser?

        data.targeting = data.targeting || {};

        deleteUnexpectedDoubleclickParams();  //Todo: Should change data.type = 'doubleclick'?
        console.log('Calling double click', new Date().getTime() - global.context.master.masterStartTime, global.context.isMaster);
        doubleclick(global, data);
    }

    function mnetHBDone() {
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

    function mnetHBTimeout() {
        global.advBidxc = global.context.master.advBidxc;
        if (typeof global.advBidxc.handleAMPHB === "function") {
            global.advBidxc.handleAMPHBTimeout({
                cb: loadDFP,
                data: data,
                winObj: global
            });
        } else {
            console.error('Mnet Error: handleAMPHBTimeout function not found');
        }
    }

    computeInMasterFrame (global, 'mnet-hb-load', function (done) {
        global.masterStartTime = startTime;
        console.log('Computing in master frame', new Date().getTime() - global.context.master.masterStartTime);
        global.mnetHBDone = done;    //Exposing the done function in master, so that we can call the done function before timeout
        writeScript(global, 'http://cmlocal.media.net/bidexchange.php?amp=1&cid=' + data.cid, () => { //todo change to live later; Can we have a timeout for bidexchange to respond (Check cmlocal on wifi)
            console.log('Bid exchange loaded', new Date().getTime() - global.context.master.masterStartTime);
            if (global.advBidxc) {
                // var result = typeof global.advBidxc.getMnetTargetingResult === "function" ? global.advBidxc.getMnetTargetingResult() : {};
                var timeout = global.configSettings && global.configSettings.hbInfo && typeof global.configSettings.hbInfo.ampDFPDelay === 'number' ? global.configSettings.hbInfo.ampDFPDelay :  dfpDefaultTimeout;
                console.log(timeout, 'Timeout');
                global.setTimeout(function () {
                    done = mnetHBTimeout; //Todo test
                    done();
                }, timeout);   //Once master script gets executed and done gets called, if some amp-ad located deep below the page gets called when the user scrolls down, its loadDFP copy gets called almost immediately(approx 10ms).
                //In child frames, the done copy(along with the parameters) that was called most recently from master gets called --> Screenshot AMP1
            } else {
                //todo: log error here
            }
        });
    }, mnetHBDone);
}

