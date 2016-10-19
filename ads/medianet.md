<!---
Copyright 2015 The AMP HTML Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS-IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# Media.net
The medianet controller supports two types of creatives: <br/>1.Basic keyword/direct ad unit. <br/>2.Header bidder tag.

## Examples
### Keyword Tag
```html
  <amp-ad width=300 height=250
            type="medianet"
            data-tag-type="sync"
            data-crid="881912246"
            data-version-id="111299"
            data-cid="8CU5Q6ABI">
  </amp-ad>
```
### Header Bidder Tag
```html
  <amp-ad width="300" height="250"
                  type="medianet"
                  data-cid="8CU759V58"
                  data-tag-type="hb"
                  data-slot="/45361917/8CUR5RQW9-ampTest"
                  json='{"targeting":{"mnetAmpTest":"1","mnet_placement":"rec"}}'
                  data-position="rec">
  </amp-ad>
```
## Configuration
###Supported parameters:
####Mandatory(for both keyword and header bidder):
- data-cid: Media.net customer id
- data-tag-type: "sync" for keyword tag, "hb" for header bidder tag

####Keyword Tag
- data-version-id: siteid given by mediaimpact
- data-crid: pageName given by mediaimpact
####Header Bidder Tag

for further information regarding this implementation please contact adtechnology@axelspringer.de 
or visit http://www.mediaimpact.de/ Todo 
