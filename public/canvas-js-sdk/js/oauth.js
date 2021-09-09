/**
* Copyright (c) 2014, salesforce.com, inc.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without modification, are permitted provided
* that the following conditions are met:
*
* Redistributions of source code must retain the above copyright notice, this list of conditions and the
* following disclaimer.
*
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
* the following disclaimer in the documentation and/or other materials provided with the distribution.
*
* Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or
* promote products derived from this software without specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
* WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
* PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
* ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
* TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
* HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
* NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
* POSSIBILITY OF SUCH DAMAGE.
*/


/**
 *@namespace Sfdc.canvas.oauth
 *@name Sfdc.canvas.oauth
 */
(function ($$) {

    "use strict";

    var storage = (function() {

        function isLocalStorage() {
            try {
                return 'sessionStorage' in window && window.sessionStorage !== null;
            } catch (e) {
                return false;
            }
        }

        return {
            get : function get(key) {
                if (isLocalStorage()) {
                    return sessionStorage.getItem(key);
                }
                return $$.cookies.get(key);
            },
            set : function set(key, value) {
                if (isLocalStorage()) {
                    return sessionStorage.setItem(key, value);
                }
                return $$.cookies.set(key, value);
            },
            remove : function remove(key) {
                if (isLocalStorage()) {
                    return sessionStorage.removeItem(key);
                }
                return $$.cookies.remove(key);
            }
        };

    }());

    var module =   (function() {

        var accessToken,
            instUrl,
            instId,
            tOrigin,
            childWindow;

        function init() {
            // Get the access token from the sessionStorage or cookie (needed to survive refresh),
            // and then remove the cookie per security's request.
            accessToken = storage.get("access_token");
            storage.remove("access_token");
        }

        function query(params) {
            var r = [], n;
            if (!$$.isUndefined(params)) {
                for (n in params) {
                    if (params.hasOwnProperty(n)) {
                        // probably should encode these
                        r.push(n + "=" + params[n]);
                    }
                }
                return "?" + r.join('&');
            }
            return '';
        }
        /**
         *@private
         */
        function refresh() {
            // Temporarily set the oauth token in a sessionStorage or cookie and then remove it
            // after the refresh.
            storage.set("access_token", accessToken);
            self.location.reload();
        }
        /**
         * @name Sfdc.canvas.oauth#login
         * @function
         * @description Opens the OAuth popup window to retrieve an OAuth token.
         * @param {Object} ctx  The context object that contains the URL, the response type, the client ID, and the callback URL
         * @docneedsimprovement
         * @example
         * function clickHandler(e)
         * {
         *  var uri;
         *  if (! connect.oauth.loggedin())
         *  {
         *   uri = connect.oauth.loginUrl();
         *   connect.oauth.login(
         *    {uri : uri,
         *     params: {
         *      response_type : "token",
         *      client_id :  "<%=consumerKey%>",
         *      redirect_uri : encodeURIComponent("/sdk/callback.html")
         *      }});
         *  } else {
         *     connect.oauth.logout();
         *  }
         *  return false;
         * }
         */
        function login(ctx) {
            var uri;

            ctx = ctx || {};
            uri = ctx.uri || "/rest/oauth2";
            ctx.params = ctx.params || {state : ""};
            ctx.params.state = ctx.params.state || ctx.callback || window.location.pathname;  // @TODO REVIEW THIS
            ctx.params.display= ctx.params.display || 'popup';
            ctx.params.redirect_uri = $$.startsWithHttp(ctx.params.redirect_uri, 
                    encodeURIComponent(window.location.protocol + "//" + window.location.hostname + ":" + window.location.port) + ctx.params.redirect_uri);
            uri = uri + query(ctx.params);
            childWindow = window.open(uri, 'OAuth', 'status=0,toolbar=0,menubar=0,resizable=0,scrollbars=1,top=50,left=50,height=500,width=680');
        }

        /**
         * @name Sfdc.canvas.oauth#token
         * @function
         * @description Sets, gets, or removes the <code>access_token</code> from this JavaScript object. <br>
         <p>This function does one of three things: <br>
         	1) If the 't' parameter isn't passed in, the current value for the <code>access_token</code> value is returned. <br>
         	2) If the the 't' parameter is null, the <code>access_token</code> value is removed. <br>
         	3) Otherwise the <code>access_token</code>  value is set to the 't' parameter and then returned.<br><br>
         	Note: for longer-term storage of the OAuth token, store it server-side in the session.  Access tokens
             should never be stored in cookies.
         * @param {String} [t] The OAuth token to set as the <code>access_token</code> value
         * @returns {String} The resulting <code>access_token</code> value if set; otherwise null
         */
        function token(t) {
            if (arguments.length === 0) {
                if (!$$.isNil(accessToken)) {return accessToken;}
            }
            else {
                accessToken = t;
            }

            return accessToken;
        }

        /**
         * @name Sfdc.canvas.oauth#instance
         * @function
         * @description Sets, gets, or removes the <code>instance_url</code> cookie. <br>
         <p> This function does one of three things: <br>
         1) If the 'i' parameter is not passed in, the current value for the <code>instance_url</code> cookie is returned. <br>
         2) If the 'i' parameter is null, the <code>instance_url</code> cookie is removed. <br>
         3) Otherwise, the <code>instance_url</code> cookie value is set to the 'i' parameter and then returned.
         * @param {String} [i] The value to set as the <code>instance_url</code> cookie
         * @returns {String} The resulting <code>instance_url</code> cookie value if set; otherwise null
         */
        function instanceUrl(i) {
            if (arguments.length === 0) {
                if (!$$.isNil(instUrl)) {return instUrl;}
                instUrl = storage.get("instance_url");
            }
            else if (i === null) {
                storage.remove("instance_url");
                instUrl = null;
            }
            else {
                storage.set("instance_url", i);
                instUrl = i;
            }
            return instUrl;
        }

        /**
         *@private
         */
            // Example Results of tha hash....
            // Name [access_token] Value [00DU0000000Xthw!ARUAQMdYg9ScuUXB5zPLpVyfYQr9qXFO7RPbKf5HyU6kAmbeKlO3jJ93gETlJxvpUDsz3mqMRL51N1E.eYFykHpoda8dPg_z]
            // Name [instance_url] Value [https://na12.salesforce.com]
            // Name [id] Value [https://login.salesforce.com/id/00DU0000000XthwMAC/005U0000000e6PoIAI]
            // Name [issued_at] Value [1331000888967]
            // Name [signature] Value [LOSzVZIF9dpKvPU07icIDOf8glCFeyd4vNGdj1dhW50]
            // Name [state] Value [/crazyrefresh.html]
        function parseHash(hash) {
            var i, nv, nvp, n, v;

            if (! $$.isNil(hash)) {
                if (hash.indexOf('#') === 0) {
                    hash = hash.substr(1);
                }
                nvp = hash.split("&");

                for (i = 0; i < nvp.length; i += 1) {
                    nv = nvp[i].split("=");
                    n = nv[0];
                    v = decodeURIComponent(nv[1]);
                    if ("access_token" === n) {
                        token(v);
                    }
                    else if ("instance_url" === n) {
                        instanceUrl(v);
                    }
                    else if ("target_origin" === n) {
                        tOrigin = decodeURIComponent(v);
                    }
                    else if ("instance_id" === n) {
                        instId = v;
                    }
                }
            }
        }

        /**
         * @name Sfdc.canvas.oauth#checkChildWindowStatus
         * @function
         * @description Refreshes the parent window only if the child window is closed. This
         * method is no longer used. Leaving in for backwards compatability.
         */
        function checkChildWindowStatus() {
            if (!childWindow || childWindow.closed) {
                refresh();
            }
        }

        /**
         * @name Sfdc.canvas.oauth#childWindowUnloadNotification
         * @function
         * @description Parses the hash value that is passed in and sets the
         <code>access_token</code> and <code>instance_url</code> cookies if they exist.  Use this method during
         User-Agent OAuth Authentication Flow to pass the OAuth token.
         * @param {String} hash A string of key-value pairs delimited by
         the ampersand character.
         * @example
         * Sfdc.canvas.oauth.childWindowUnloadNotification(self.location.hash);
         */
        function childWindowUnloadNotification(hash) {
            // Here we get notification from child window. Here we can decide if such notification is
            // raised because user closed child window, or because user is playing with F5 key.
            // NOTE: We can not trust on "onUnload" event of child window, because if user reload or refresh
            // such window in fact he is not closing child. (However "onUnload" event is raised!)

            var retry = 0, maxretries = 10;

            // Internal check child window status with max retry logic
            function cws() {

                retry++;
                if (!childWindow || childWindow.closed) {
                    refresh();
                }
                else if (retry < maxretries) {
                    setTimeout(cws, 50);
                }
            }

            parseHash(hash);
            setTimeout(cws, 50);
        }

        /**
         * @name Sfdc.canvas.oauth#logout
         * @function
         * @description Removes the <code>access_token</code> OAuth token from this object.
         */
        function logout() {
            // Remove the oauth token and refresh the browser
            token(null);
        }

        /**
         * @name Sfdc.canvas.oauth#loggedin
         * @function
         * @description Returns the login state.
         * @returns {Boolean} <code>true</code> if the <code>access_token</code> is available in this JS object.
         * Note: <code>access tokens</code> (for example, OAuth tokens) should be stored server-side for more durability.
         * Never store OAuth tokens in cookies as this can lead to a security risk.
         */
        function loggedin() {
            return !$$.isNil(token());
        }

        /**
         * @name Sfdc.canvas.oauth#loginUrl
         * @function
         * @description Returns the URL for the OAuth authorization service.
         * @returns {String} The URL for the OAuth authorization service or default if there's
         *   no value for loginUrl in the current URL's query string
         */
        function loginUrl() {
            var i, nvs, nv, q = self.location.search;

            if (q) {
                q = q.substring(1);
                nvs = q.split("&");
                for (i = 0; i < nvs.length; i += 1)
                {
                    nv = nvs[i].split("=");
                    if ("loginUrl" === nv[0]) {
                        return decodeURIComponent(nv[1]) + "/services/oauth2/authorize";
                    }
                }
            }
            return "https://login.salesforce.com/services/oauth2/authorize";
        }

        function targetOrigin(to) {

            if (!$$.isNil(to)) {
                tOrigin = to;
                return to;
            }

            if (!$$.isNil(tOrigin)) {return tOrigin;}

            // This relies on the parent passing it in. This may not be there as the client can do a
            // redirect or link to another page
            parseHash(document.location.hash);
            return tOrigin;
        }

        function instanceId(id) {

            if (!$$.isNil(id)) {
                instId = id;
                return id;
            }

            if (!$$.isNil(instId)) {return instId;}

            // This relies on the parent passing it in. This may not be there as the client can do a
            // redirect or link to another page
            parseHash(document.location.hash);
            return instId;
        }

        function client() {
            return {oauthToken : token(), instanceId : instanceId(), targetOrigin : targetOrigin()};
        }

        return {
            init : init,
            login : login,
            logout : logout,
            loggedin : loggedin,
            loginUrl : loginUrl,
            token : token,
            instance : instanceUrl,
            client : client,
            checkChildWindowStatus : checkChildWindowStatus,
            childWindowUnloadNotification: childWindowUnloadNotification
        };
    }());

    $$.module('Sfdc.canvas.oauth', module);

    $$.oauth.init();

}(Sfdc.canvas));