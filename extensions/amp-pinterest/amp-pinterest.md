<!---
Copyright 2015 The AMP HTML Authors.

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

# <a name=”amp-pinterest”></a> `amp-pinterest`

<table>
  <tr>
    <td width="40%"><strong>Description</strong></td>
    <td>Displays a Pinterest widget or Pin It button.</td>
  </tr>
  <tr>
    <td width="40%"><strong>Availability</strong></td>
    <td>Stable</td>
  </tr>
  <tr>
    <td width="40%"><strong>Required Script</strong></td>
    <td><code>&lt;script async custom-element="amp-pinterest" src="https://cdn.ampproject.org/v0/amp-pinterest-0.1.js">&lt;/script></code></td>
  </tr>
  <tr>
    <td class="col-fourty"><strong><a href="https://www.ampproject.org/docs/guides/responsive/control_layout.html">Supported Layouts</a></strong></td>
    <td>fill, fixed, fixed-height, flex-item, nodisplay, responsive</td>
  </tr>
  <tr>
    <td width="40%"><strong>Examples</strong></td>
    <td><a href="https://ampbyexample.com/components/amp-pinterest/">Annotated code example for amp-pinterest</a></td>
  </tr>
</table>

## Examples:

Pin It button: `data-do="buttonPin"`

    <amp-pinterest height=20 width=40
      data-do="buttonPin"
      data-url="http://www.flickr.com/photos/kentbrew/6851755809/"
      data-media="http://farm8.staticflickr.com/7027/6851755809_df5b2051c9_z.jpg"
      data-description="Next stop: Pinterest">
    </amp-pinterest>

Embedded pin widget: `data-do="embedPin"`

    <amp-pinterest width=245 height=330
      data-do="embedPin"
      data-url="https://www.pinterest.com/pin/99360735500167749/">
    </amp-pinterest>

## Pin It Button

**data-url**

Required when `data-do` is `buttonPin`.  Contains the fully-qualified URL intended to be pinned or re-made into a widget.

**data-media**

Required when `data-do` is `buttonPin`.  Contains the fully-qualified URL of the image intended to be pinned. If the pin will eventually contain multimedia (such as YouTube), should point to a high-resolution thumbnail.

**data-description**

Required when `data-do` is `buttonPin`.  Contains the default description that appears in the pin create form; please choose carefully, since many Pinners will close the form without pinning if it doesn't make sense.

### Sizing the Pin It Button

Default small rectangular button:

    height=20 width=40

Small rectangular button with pin count to the right, using `data-count="beside"`

    height=28 width=85

Small rectangular button with pin count on top, using `data-count="above"`

    height=50 width=40

Large rectangular button using data-height="tall"

    height=28 width=56

Large rectangular button with pin count to the right, using `data-tall="true"` and `data-count="beside"`

    height=28 width=107

Large rectangular button with pin count on top, using `data-height="tall"` and `data-count="above"`

    height=66 width=56

Small circular button using `data-round="true"`

    height=16 width=16

Large circular button using `data-round="true"` and `data-height="tall"`

    height=32 width=32

## Follow Button

**data-href**

Required when `data-do` is `buttonFollow`.  Contains the fully qualified Pinterest user profile url to follow.

**data-label**

Required when `data-do` is `buttonFollow`.  Contains the text to display on the follow button.

## Embedded Pin Widget

**data-url**

When building the Embedded Pin widget, `data-url` is required and must contain the fully-qualified URL of the Pinterest resource to be shown as a widget.

    data-do="embedPin"
    data-url="https://www.pinterest.com/pin/99360735500167749/"

## Validation

See [amp-pinterest rules](https://github.com/ampproject/amphtml/blob/master/extensions/amp-pinterest/0.1/validator-amp-pinterest.protoascii) in the AMP validator specification.
