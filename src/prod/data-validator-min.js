export const Parser=function(){"use strict";function e(t,r,n,i){this.message=t,this.expected=r,this.found=n,this.location=i,this.name="SyntaxError","function"==typeof Error.captureStackTrace&&Error.captureStackTrace(this,e)}return function(e,t){function r(){this.constructor=e}r.prototype=t.prototype,e.prototype=new r}(e,Error),e.buildMessage=function(e,t){let r={literal:function(e){return'"'+i(e.text)+'"'},class:function(e){let t,r="";for(t=0;t<e.parts.length;t++)r+=e.parts[t]instanceof Array?a(e.parts[t][0])+"-"+a(e.parts[t][1]):a(e.parts[t]);return"["+(e.inverted?"^":"")+r+"]"},any:function(e){return"any character"},end:function(e){return"end of input"},other:function(e){return e.description}};function n(e){return e.charCodeAt(0).toString(16).toUpperCase()}function i(e){return e.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\0/g,"\\0").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/[\x00-\x0F]/g,(function(e){return"\\x0"+n(e)})).replace(/[\x10-\x1F\x7F-\x9F]/g,(function(e){return"\\x"+n(e)}))}function a(e){return e.replace(/\\/g,"\\\\").replace(/\]/g,"\\]").replace(/\^/g,"\\^").replace(/-/g,"\\-").replace(/\0/g,"\\0").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/[\x00-\x0F]/g,(function(e){return"\\x0"+n(e)})).replace(/[\x10-\x1F\x7F-\x9F]/g,(function(e){return"\\x"+n(e)}))}return"Expected "+function(e){let t,n,i=new Array(e.length);for(t=0;t<e.length;t++)i[t]=(a=e[t],r[a.type](a));var a;if(i.sort(),i.length>0){for(t=1,n=1;t<i.length;t++)i[t-1]!==i[t]&&(i[n]=i[t],n++);i.length=n}switch(i.length){case 1:return i[0];case 2:return i[0]+" or "+i[1];default:return i.slice(0,-1).join(", ")+", or "+i[i.length-1]}}(e)+" but "+function(e){return e?'"'+i(e)+'"':"end of input"}(t)+" found."},{SyntaxError:e,parse:function(t,r){r=void 0!==r?r:{};let n,i={},a={Format:He},s=He,l=function(e,t){return t},u=function(e,t){return t},o="...",c=Le("...",!1),f=ze("identifier:data-type pair"),d=Le("?",!1),p=ze("repeat-count"),h="..",y=Le("..",!1),g=ze("function-list"),v=function(e,t){return[e,...t]},R=ze("function"),m=".",b=Le(".",!1),x=ze("value-list"),$="null",I=Le("null",!1),A=(ze("bool"),"false"),N=Le("false",!1),O="true",V=Le("true",!1),S=ze("object"),E=function(e,t){return t},k=ze("key:val pair"),w=function(e,t){return[e,t]},T=ze("key"),j=function(){return _e()},C=ze("identifier"),J=/^[_a-z$]/i,F=Ue(["_",["a","z"],"$"],!1,!0),P=/^[0-9a-z$_]/i,D=Ue([["0","9"],["a","z"],"$","_"],!1,!0),_=ze("number"),L="-",U=Le("-",!1),z=/^[eE]/,M=Ue(["e","E"],!1,!1),B=Le("+",!1),q=Le("0",!1),G=/^[1-9]/,H=Ue([["1","9"]],!1,!1),K=/^[0-9]/,Q=Ue([["0","9"]],!1,!1),W=ze("string"),X=Le('"',!1),Y=function(e){return e.join("")},Z=Le("'",!1),ee=Le("`",!1),te=/^[^\0-\x1F\\"]/,re=Ue([["\0",""],"\\",'"'],!0,!1),ne=/^[^\0-\x1F\\']/,ie=Ue([["\0",""],"\\","'"],!0,!1),ae=/^[^\0-\x1F\\`]/,se=Ue([["\0",""],"\\","`"],!0,!1),le=ze("Escaped-Char"),ue=Le("\\\\",!1),oe=Le('\\"',!1),ce=Le("\\'",!1),fe=Le("\\`",!1),de=Le("\\b",!1),pe=Le("\\f",!1),he=Le("\\n",!1),ye=Le("\\r",!1),ge=Le("\\t",!1),ve=Le("\\u",!1),Re=Le("[",!1),me=Le("]",!1),be=Le("(",!1),xe=Le(")",!1),$e=Le("{",!1),Ie=Le("}",!1),Ae=Le(":",!1),Ne=Le(",",!1),Oe=Le("|",!1),Ve=Le("=>",!1),Se=ze("whitespace"),Ee=/^[ \t\n\r]/,ke=Ue([" ","\t","\n","\r"],!1,!1),we=/^[0-9a-f]/i,Te=Ue([["0","9"],["a","f"]],!1,!0),je=0,Ce=0,Je=[{line:1,column:1}],Fe=0,Pe=[],De=0;if("startRule"in r){if(!(r.startRule in a))throw new Error("Can't start parsing from rule \""+r.startRule+'".');s=a[r.startRule]}function _e(){return t.substring(Ce,je)}function Le(e,t){return{type:"literal",text:e,ignoreCase:t}}function Ue(e,t,r){return{type:"class",parts:e,inverted:t,ignoreCase:r}}function ze(e){return{type:"other",description:e}}function Me(e){let r,n=Je[e];if(n)return n;for(r=e-1;!Je[r];)r--;for(n=Je[r],n={line:n.line,column:n.column};r<e;)10===t.charCodeAt(r)?(n.line++,n.column=1):n.column++,r++;return Je[e]=n,n}function Be(e,t){let r=Me(e),n=Me(t);return{start:{offset:e,line:r.line,column:r.column},end:{offset:t,line:n.line,column:n.column}}}function qe(e){je<Fe||(je>Fe&&(Fe=je,Pe=[]),Pe.push(e))}function Ge(t,r,n){return new e(e.buildMessage(t,r),t,r,n)}function He(){let e,t,r,n,a,s,u;if(e=je,t=$t(),t!==i)if(r=Ke(),r!==i){for(n=[],a=je,s=xt(),s!==i?(u=Ke(),u!==i?(Ce=a,s=l(0,u),a=s):(je=a,a=i)):(je=a,a=i);a!==i;)n.push(a),a=je,s=xt(),s!==i?(u=Ke(),u!==i?(Ce=a,s=l(0,u),a=s):(je=a,a=i)):(je=a,a=i);n!==i?(Ce=e,t=function(e,t){let r=[e,...t];for(;r.length>1;){const e=r.pop();r[r.length-1].nxt=e}return r[0]}(r,n),e=t):(je=e,e=i)}else je=e,e=i;else je=e,e=i;return e===i&&(e=je,t=$t(),t!==i?(r=Ke(),r!==i?(t=[t,r],e=t):(je=e,e=i)):(je=e,e=i)),e}function Ke(){let e,r,n,a,s,l,f,d;if(e=je,r=ht(),r!==i)if(n=He(),n!==i){for(a=[],s=je,l=bt(),l!==i?(f=He(),f!==i?(Ce=s,l=u(0,f),s=l):(je=s,s=i)):(je=s,s=i);s!==i;)a.push(s),s=je,l=bt(),l!==i?(f=He(),f!==i?(Ce=s,l=u(0,f),s=l):(je=s,s=i)):(je=s,s=i);a!==i?(s=yt(),s!==i?(l=Xe(),l===i&&(l=null),l!==i?(Ce=e,r=function(e,t,r){const n=[e,...t];if(1===n.length)return[...n[0]?.rf??[],...r??[]].length>0&&(n[0].rf=frList),n[0];const i={ty:"@or@",opts:n};return r&&(i.rf=r),i}(n,a,l),e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i)}else je=e,e=i;else je=e,e=i;if(e===i){if(e=je,r=dt(),r!==i){if(n=je,a=We(),a!==i){for(s=[],l=je,f=mt(),f!==i?(d=We(),d!==i?(Ce=l,f=u(0,d),l=f):(je=l,l=i)):(je=l,l=i);l!==i;)s.push(l),l=je,f=mt(),f!==i?(d=We(),d!==i?(Ce=l,f=u(0,d),l=f):(je=l,l=i)):(je=l,l=i);s!==i?(l=mt(),l===i&&(l=null),l!==i?(Ce=n,p=s,a=[a,...p],n=a):(je=n,n=i)):(je=n,n=i)}else je=n,n=i;n===i&&(n=null),n!==i?(a=pt(),a!==i?(s=Xe(),s===i&&(s=null),s!==i?(Ce=e,r=function(e,t){const r={ty:"@arr@",list:e??[]};return t&&(r.rf=t),r}(n,s),e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i)}else je=e,e=i;if(e===i){if(e=je,r=gt(),r!==i){if(n=je,a=Qe(),a!==i){for(s=[],l=je,f=mt(),f!==i?(d=Qe(),d!==i?(Ce=l,f=u(0,d),l=f):(je=l,l=i)):(je=l,l=i);l!==i;)s.push(l),l=je,f=mt(),f!==i?(d=Qe(),d!==i?(Ce=l,f=u(0,d),l=f):(je=l,l=i)):(je=l,l=i);s!==i?(l=je,f=mt(),f!==i?(t.substr(je,3)===o?(d=o,je+=3):(d=i,0===De&&qe(c)),d!==i?(f=[f,d],l=f):(je=l,l=i)):(je=l,l=i),l===i&&(l=null),l!==i?(f=mt(),f===i&&(f=null),f!==i?(Ce=n,a=function(e,t,r){return{list:Object.fromEntries([e,...t]),keep:null!==r}}(a,s,l),n=a):(je=n,n=i)):(je=n,n=i)):(je=n,n=i)}else je=n,n=i;n===i&&(n=null),n!==i?(a=vt(),a!==i?(s=Xe(),s===i&&(s=null),s!==i?(Ce=e,r=function(e,t){e??={};const r={ty:"@obj@",list:e?.list??[]};return e?.keep&&(r.keep_extra=!0),t&&(r.rf=t),r}(n,s),e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i)}else je=e,e=i;e===i&&(e=je,r=it(),r!==i?(n=Xe(),n===i&&(n=null),n!==i?(Ce=e,r=function(e,t){const r={ty:e};return t&&(r.rf=t),r}(r,n),e=r):(je=e,e=i)):(je=e,e=i))}}var p;return e}function Qe(){let e,r,n,a,s;var l,u,o;return De++,e=je,63===t.charCodeAt(je)?(r="?",je++):(r=i,0===De&&qe(d)),r===i&&(r=null),r!==i?(n=it(),n!==i?(a=Rt(),a!==i?(s=He(),s!==i?(Ce=e,l=r,u=n,(o=s).opt=null!==l,r=[u,o],e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i)):(je=e,e=i),De--,e===i&&(r=i,0===De&&qe(f)),e}function We(){let e,r,n;var a,s;return e=je,r=function(){let e,r,n,a,s;De++,e=je,t.substr(je,2)===h?(r=h,je+=2):(r=i,0===De&&qe(y));r!==i?(n=at(),n!==i?(t.substr(je,2)===h?(a=h,je+=2):(a=i,0===De&&qe(y)),a!==i?(s=$t(),s!==i?(Ce=e,r=parseFloat(n),e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i)):(je=e,e=i);e===i&&(e=je,t.substr(je,3)===o?(r=o,je+=3):(r=i,0===De&&qe(c)),r!==i?(n=$t(),n!==i?(Ce=e,r="many",e=r):(je=e,e=i)):(je=e,e=i));De--,e===i&&(r=i,0===De&&qe(p));return e}(),r===i&&(r=null),r!==i?(n=He(),n!==i?(Ce=e,s=n,null!==(a=r)&&(s.more=a),r=s,e=r):(je=e,e=i)):(je=e,e=i),e}function Xe(){let e,t,r,n;if(De++,e=je,t=Ye(),t!==i){for(r=[],n=Ye();n!==i;)r.push(n),n=Ye();r!==i?(Ce=e,t=v(t,r),e=t):(je=e,e=i)}else je=e,e=i;return De--,e===i&&(t=i,0===De&&qe(g)),e}function Ye(){let e,r,n,a,s,l,u,o;return De++,e=je,r=$t(),r!==i?(46===t.charCodeAt(je)?(n=m,je++):(n=i,0===De&&qe(b)),n!==i?(a=it(),a!==i?(s=je,l=ht(),l!==i?(u=Ze(),u===i&&(u=null),u!==i?(o=yt(),o!==i?(Ce=s,l=u,s=l):(je=s,s=i)):(je=s,s=i)):(je=s,s=i),s===i&&(s=null),s!==i?(Ce=e,r=function(e,t){const r={fn:e};return t&&(r.args=t),r}(a,s),e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i)):(je=e,e=i),De--,e===i&&(r=i,0===De&&qe(R)),e}function Ze(){let e,t,r,n,a,s;if(De++,e=je,t=et(),t!==i){for(r=[],n=je,a=mt(),a!==i?(s=et(),s!==i?(Ce=n,a=u(0,s),n=a):(je=n,n=i)):(je=n,n=i);n!==i;)r.push(n),n=je,a=mt(),a!==i?(s=et(),s!==i?(Ce=n,a=u(0,s),n=a):(je=n,n=i)):(je=n,n=i);r!==i?(Ce=e,t=v(t,r),e=t):(je=e,e=i)}else je=e,e=i;return De--,e===i&&(t=i,0===De&&qe(x)),e}function et(){let e;return e=tt(),e===i&&(e=function(){let e,r;e=je,t.substr(je,4)===$?(r=$,je+=4):(r=i,0===De&&qe(I));r!==i&&(Ce=e,r=null);return e=r,e}(),e===i&&(e=rt(),e===i&&(e=function(){let e,t,r,n,a,s,l,u;if(De++,e=je,t=gt(),t!==i){if(r=je,n=nt(),n!==i){for(a=[],s=je,l=mt(),l!==i?(u=nt(),u!==i?(Ce=s,l=E(0,u),s=l):(je=s,s=i)):(je=s,s=i);s!==i;)a.push(s),s=je,l=mt(),l!==i?(u=nt(),u!==i?(Ce=s,l=E(0,u),s=l):(je=s,s=i)):(je=s,s=i);a!==i?(Ce=r,c=n,f=a,n=Object.fromEntries([c,...f]),r=n):(je=r,r=i)}else je=r,r=i;r===i&&(r=null),r!==i?(n=mt(),n===i&&(n=null),n!==i?(a=vt(),a!==i?(Ce=e,t=null!==(o=r)?o:{},e=t):(je=e,e=i)):(je=e,e=i)):(je=e,e=i)}else je=e,e=i;var o;var c,f;De--,e===i&&(t=i,0===De&&qe(S));return e}(),e===i&&(e=function(){let e,t,r,n,a;e=je,t=dt(),t!==i?(r=Ze(),r===i&&(r=null),r!==i?(n=mt(),n===i&&(n=null),n!==i?(a=pt(),a!==i?(Ce=e,t=r??[],e=t):(je=e,e=i)):(je=e,e=i)):(je=e,e=i)):(je=e,e=i);return e}(),e===i&&(e=function(){let e,r,n,a,s,l,u;De++,e=je,45===t.charCodeAt(je)?(r="-",je++):(r=i,0===De&&qe(U));r===i&&(r=null);if(r!==i)if(n=at(),n!==i){if(a=je,46===t.charCodeAt(je)?(s=m,je++):(s=i,0===De&&qe(b)),s!==i){if(l=[],u=st(),u!==i)for(;u!==i;)l.push(u),u=st();else l=i;l!==i?(s=[s,l],a=s):(je=a,a=i)}else je=a,a=i;a===i&&(a=null),a!==i?(s=function(){let e,r,n,a,s;e=je,z.test(t.charAt(je))?(r=t.charAt(je),je++):(r=i,0===De&&qe(M));if(r!==i)if(45===t.charCodeAt(je)?(n=L,je++):(n=i,0===De&&qe(U)),n===i&&(43===t.charCodeAt(je)?(n="+",je++):(n=i,0===De&&qe(B))),n===i&&(n=null),n!==i){if(a=[],s=st(),s!==i)for(;s!==i;)a.push(s),s=st();else a=i;a!==i?(Ce=e,r=j(),e=r):(je=e,e=i)}else je=e,e=i;else je=e,e=i;return e}(),s===i&&(s=null),s!==i?(Ce=e,r=parseFloat(_e()),e=r):(je=e,e=i)):(je=e,e=i)}else je=e,e=i;else je=e,e=i;De--,e===i&&(r=i,0===De&&qe(_));return e}(),e===i&&(e=lt())))))),e}function tt(){let e,r;return e=je,t.substr(je,5)===A?(r=A,je+=5):(r=i,0===De&&qe(N)),r!==i&&(Ce=e,r=!1),e=r,e}function rt(){let e,r;return e=je,t.substr(je,4)===O?(r=O,je+=4):(r=i,0===De&&qe(V)),r!==i&&(Ce=e,r=!0),e=r,e}function nt(){let e,r,n,a;return De++,e=je,r=lt(),r!==i?(n=Rt(),n!==i?(a=et(),a!==i?(Ce=e,r=w(r,a),e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i),e===i&&(e=je,r=function(){let e,r,n,a,s,l;if(De++,e=je,r=it(),r!==i){for(n=[],a=je,46===t.charCodeAt(je)?(s=m,je++):(s=i,0===De&&qe(b)),s!==i?(l=it(),l!==i?(s=[s,l],a=s):(je=a,a=i)):(je=a,a=i);a!==i;)n.push(a),a=je,46===t.charCodeAt(je)?(s=m,je++):(s=i,0===De&&qe(b)),s!==i?(l=it(),l!==i?(s=[s,l],a=s):(je=a,a=i)):(je=a,a=i);n!==i?(Ce=e,r=j(),e=r):(je=e,e=i)}else je=e,e=i;De--,e===i&&(r=i,0===De&&qe(T));return e}(),r!==i?(n=Rt(),n!==i?(a=et(),a!==i?(Ce=e,r=w(r,a),e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i)),De--,e===i&&(r=i,0===De&&qe(k)),e}function it(){let e,r,n,a,s;if(De++,e=je,r=je,J.test(t.charAt(je))?(n=t.charAt(je),je++):(n=i,0===De&&qe(F)),n!==i){for(a=[],P.test(t.charAt(je))?(s=t.charAt(je),je++):(s=i,0===De&&qe(D));s!==i;)a.push(s),P.test(t.charAt(je))?(s=t.charAt(je),je++):(s=i,0===De&&qe(D));a!==i?(n=[n,a],r=n):(je=r,r=i)}else je=r,r=i;return r!==i&&(Ce=e,r=j()),e=r,De--,e===i&&(r=i,0===De&&qe(C)),e}function at(){let e,r,n,a,s;if(e=je,48===t.charCodeAt(je)?(r="0",je++):(r=i,0===De&&qe(q)),r===i)if(r=je,G.test(t.charAt(je))?(n=t.charAt(je),je++):(n=i,0===De&&qe(H)),n!==i){for(a=[],s=st();s!==i;)a.push(s),s=st();a!==i?(n=[n,a],r=n):(je=r,r=i)}else je=r,r=i;return r!==i&&(Ce=e,r=j()),e=r,e}function st(){let e;return K.test(t.charAt(je))?(e=t.charAt(je),je++):(e=i,0===De&&qe(Q)),e}function lt(){let e,r,n,a;if(De++,e=je,34===t.charCodeAt(je)?(r='"',je++):(r=i,0===De&&qe(X)),r!==i){for(n=[],a=ut();a!==i;)n.push(a),a=ut();n!==i?(34===t.charCodeAt(je)?(a='"',je++):(a=i,0===De&&qe(X)),a!==i?(Ce=e,r=Y(n),e=r):(je=e,e=i)):(je=e,e=i)}else je=e,e=i;if(e===i){if(e=je,39===t.charCodeAt(je)?(r="'",je++):(r=i,0===De&&qe(Z)),r!==i){for(n=[],a=ot();a!==i;)n.push(a),a=ot();n!==i?(39===t.charCodeAt(je)?(a="'",je++):(a=i,0===De&&qe(Z)),a!==i?(Ce=e,r=Y(n),e=r):(je=e,e=i)):(je=e,e=i)}else je=e,e=i;if(e===i)if(e=je,96===t.charCodeAt(je)?(r="`",je++):(r=i,0===De&&qe(ee)),r!==i){for(n=[],a=ct();a!==i;)n.push(a),a=ct();n!==i?(96===t.charCodeAt(je)?(a="`",je++):(a=i,0===De&&qe(ee)),a!==i?(Ce=e,r=Y(n),e=r):(je=e,e=i)):(je=e,e=i)}else je=e,e=i}return De--,e===i&&(r=i,0===De&&qe(W)),e}function ut(){let e,r;return te.test(t.charAt(je))?(e=t.charAt(je),je++):(e=i,0===De&&qe(re)),e===i&&(e=je,r=ft(),r!==i&&(Ce=e,r=r),e=r),e}function ot(){let e,r;return ne.test(t.charAt(je))?(e=t.charAt(je),je++):(e=i,0===De&&qe(ie)),e===i&&(e=je,r=ft(),r!==i&&(Ce=e,r=r),e=r),e}function ct(){let e,r;return ae.test(t.charAt(je))?(e=t.charAt(je),je++):(e=i,0===De&&qe(se)),e===i&&(e=je,r=ft(),r!==i&&(Ce=e,r=r),e=r),e}function ft(){let e,r,n,a,s,l,u,o;var c;return De++,e=je,"\\\\"===t.substr(je,2)?(r="\\\\",je+=2):(r=i,0===De&&qe(ue)),r!==i&&(Ce=e,r="\\"),e=r,e===i&&(e=je,'\\"'===t.substr(je,2)?(r='\\"',je+=2):(r=i,0===De&&qe(oe)),r!==i&&(Ce=e,r='"'),e=r,e===i&&(e=je,"\\'"===t.substr(je,2)?(r="\\'",je+=2):(r=i,0===De&&qe(ce)),r!==i&&(Ce=e,r="'"),e=r,e===i&&(e=je,"\\`"===t.substr(je,2)?(r="\\`",je+=2):(r=i,0===De&&qe(fe)),r!==i&&(Ce=e,r="`"),e=r,e===i&&(e=je,"\\b"===t.substr(je,2)?(r="\\b",je+=2):(r=i,0===De&&qe(de)),r!==i&&(Ce=e,r="\b"),e=r,e===i&&(e=je,"\\f"===t.substr(je,2)?(r="\\f",je+=2):(r=i,0===De&&qe(pe)),r!==i&&(Ce=e,r="\f"),e=r,e===i&&(e=je,"\\n"===t.substr(je,2)?(r="\\n",je+=2):(r=i,0===De&&qe(he)),r!==i&&(Ce=e,r="\n"),e=r,e===i&&(e=je,"\\r"===t.substr(je,2)?(r="\\r",je+=2):(r=i,0===De&&qe(ye)),r!==i&&(Ce=e,r="\r"),e=r,e===i&&(e=je,"\\t"===t.substr(je,2)?(r="\\t",je+=2):(r=i,0===De&&qe(ge)),r!==i&&(Ce=e,r="\t"),e=r,e===i&&(e=je,"\\u"===t.substr(je,2)?(r="\\u",je+=2):(r=i,0===De&&qe(ve)),r!==i?(n=je,a=je,s=It(),s!==i?(l=It(),l!==i?(u=It(),u!==i?(o=It(),o!==i?(s=[s,l,u,o],a=s):(je=a,a=i)):(je=a,a=i)):(je=a,a=i)):(je=a,a=i),n=a!==i?t.substring(n,je):a,n!==i?(Ce=e,c=n,r=String.fromCharCode(parseInt(c,16)),e=r):(je=e,e=i)):(je=e,e=i)))))))))),De--,e===i&&(r=i,0===De&&qe(le)),e}function dt(){let e,r,n,a;return e=je,r=$t(),r!==i?(91===t.charCodeAt(je)?(n="[",je++):(n=i,0===De&&qe(Re)),n!==i?(a=$t(),a!==i?(r=[r,n,a],e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i),e}function pt(){let e,r,n,a;return e=je,r=$t(),r!==i?(93===t.charCodeAt(je)?(n="]",je++):(n=i,0===De&&qe(me)),n!==i?(a=$t(),a!==i?(r=[r,n,a],e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i),e}function ht(){let e,r,n,a;return e=je,r=$t(),r!==i?(40===t.charCodeAt(je)?(n="(",je++):(n=i,0===De&&qe(be)),n!==i?(a=$t(),a!==i?(r=[r,n,a],e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i),e}function yt(){let e,r,n,a;return e=je,r=$t(),r!==i?(41===t.charCodeAt(je)?(n=")",je++):(n=i,0===De&&qe(xe)),n!==i?(a=$t(),a!==i?(r=[r,n,a],e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i),e}function gt(){let e,r,n,a;return e=je,r=$t(),r!==i?(123===t.charCodeAt(je)?(n="{",je++):(n=i,0===De&&qe($e)),n!==i?(a=$t(),a!==i?(r=[r,n,a],e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i),e}function vt(){let e,r,n,a;return e=je,r=$t(),r!==i?(125===t.charCodeAt(je)?(n="}",je++):(n=i,0===De&&qe(Ie)),n!==i?(a=$t(),a!==i?(r=[r,n,a],e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i),e}function Rt(){let e,r,n,a;return e=je,r=$t(),r!==i?(58===t.charCodeAt(je)?(n=":",je++):(n=i,0===De&&qe(Ae)),n!==i?(a=$t(),a!==i?(r=[r,n,a],e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i),e}function mt(){let e,r,n,a;return e=je,r=$t(),r!==i?(44===t.charCodeAt(je)?(n=",",je++):(n=i,0===De&&qe(Ne)),n!==i?(a=$t(),a!==i?(r=[r,n,a],e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i),e}function bt(){let e,r,n,a;return e=je,r=$t(),r!==i?(124===t.charCodeAt(je)?(n="|",je++):(n=i,0===De&&qe(Oe)),n!==i?(a=$t(),a!==i?(r=[r,n,a],e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i),e}function xt(){let e,r,n,a;return e=je,r=$t(),r!==i?("=>"===t.substr(je,2)?(n="=>",je+=2):(n=i,0===De&&qe(Ve)),n!==i?(a=$t(),a!==i?(r=[r,n,a],e=r):(je=e,e=i)):(je=e,e=i)):(je=e,e=i),e}function $t(){let e,r;for(De++,e=[],Ee.test(t.charAt(je))?(r=t.charAt(je),je++):(r=i,0===De&&qe(ke));r!==i;)e.push(r),Ee.test(t.charAt(je))?(r=t.charAt(je),je++):(r=i,0===De&&qe(ke));return De--,e===i&&(r=i,0===De&&qe(Se)),e}function It(){let e;return we.test(t.charAt(je))?(e=t.charAt(je),je++):(e=i,0===De&&qe(Te)),e}if(n=s(),n!==i&&je===t.length)return n;throw n!==i&&je<t.length&&qe({type:"end"}),Ge(Pe,Fe<t.length?t.charAt(Fe):null,Fe<t.length?Be(Fe,Fe+1):Be(Fe,Fe))}}}();export class Ret{value;valid;error;constructor(e,t){this.valid=e,this.value=e?t:null,this.error=e?null:t}static Valid(e=null){return new Ret(!0,e)}static Invalid(e=null){return new Ret(!1,e)}}function ordinal(e){let t=["th","st","nd","rd"],r=e%100;return e+(t[(r-20)%10]||t[r]||t[0])}export function checkParameterType(e,...t){for(const[r,n]of Object.entries(t))if(typeof n!==e[r])return Ret.Invalid(`Expected ${e[r]} as ${ordinal(parseInt(r)+1)} parameter; Received: ${JSON.stringify(n)}`);return null}class TypeStore{#e=null;#t={"@arr@":{rf:{slice:function(e,t=0,r=null){if(!Array.isArray(e))return Ret.Invalid(`Expected array; Received: ${JSON.stringify(e)}`);r??=e.length-1;const n=checkParameterType(["number","number"],t,r);return null!==n?n:Ret.Valid(e.slice(t,r))},at:function(e,t=0){if(!Array.isArray(e))return Ret.Invalid(`Expected array; Received: ${JSON.stringify(e)}`);const r=checkParameterType(["number"],t);return null!==r?r:Ret.Valid(e.at(t))},join:function(e,t=","){if(!Array.isArray(e))return Ret.Invalid(`Expected array; Received: ${JSON.stringify(e)}`);const r=checkParameterType(["string"],t);return null!==r?r:Ret.Valid(e.join(t))}}},"@obj@":{rf:{slice:function(e,...t){const r=[];for(const n of t)Object.hasOwn(e,n)&&r.push([n,e[n]]);switch(t.length){case 0:return Ret.Valid(null);case 1:return 0===r.length?Ret.Valid(null):Ret.Valid(r[0][1]);default:return Ret.Valid(Object.fromEntries(r))}}}},"@or@":{},null:{parse:function(e){return null===e||""===(e=new String(e).toLowerCase())||"null"===e?Ret.Valid(null):Ret.Invalid()}},any:{parse:function(e){return Ret.Valid(e)},rf:{allowed:function(e,...t){return t.includes(e)?Ret.Valid(e):Ret.Invalid(`Value ${JSON.stringify(e)} not allowed`)},toString:function(e){switch(typeof e){case"object":return null===e?"null":Ret.Valid(JSON.stringify(e));case"undefined":return Ret.Valid("");case"boolean":case"string":case"bigint":case"number":return Ret.Valid(new String(e).valueOf());case"function":case"symbol":default:return Ret.Invalid(`Cannot convert ${JSON.stringify(e)} to string`)}},__native__:function(e,t,...r){const n=checkParameterType(["string",t]);if(null!==n)return n;const i=e[t]??null;if("function"!=typeof i)return Ret.Invalid(`There is no native function '${t}' for type '${Object.prototype.toString.call(e)}'`);try{const t=i.call(e,...r);return Ret.Valid(t)}catch(e){return Ret.Invalid(e.message)}}}},string:{parse:function(e){switch(typeof e){case"object":return null===e?"null":Ret.Valid(JSON.stringify(e));case"undefined":return Ret.Valid("");case"boolean":case"string":case"bigint":case"number":return Ret.Valid(new String(e).valueOf());case"function":case"symbol":default:return Ret.Invalid()}},rf:{split:function(e,t=" "){return"string"==typeof e?Ret.Valid(e.split(t)):Ret.Invalid(`Expected string; Received: ${JSON.stringify(e)}`)},lower:function(e){return"string"==typeof e?Ret.Valid(e.toLowerCase()):Ret.Invalid(`Expected string; Received: ${JSON.stringify(e)}`)},upper:function(e){return"string"==typeof e?Ret.Valid(e.toUpperCase()):Ret.Invalid(`Expected string; Received: ${JSON.stringify(e)}`)},title:function(e){return"string"==typeof e?Ret.Valid(e.replace(/\w\S*/g,(e=>`${e.charAt(0).toUpperCase()}${e.substring(1).toLowerCase()}`))):Ret.Invalid(`Expected string; Received: ${JSON.stringify(e)}`)},slice:function(e,t=0,r=null){if("string"!=typeof e)return Ret.Invalid(`Expected string; Received: ${JSON.stringify(e)}`);r??=e.length-1;const n=checkParameterType(["number","number"],t,r);return null!==n?n:Ret.Valid(e.slice(t,r))},padStart:function(e,t,r=" "){if("string"!=typeof e)return Ret.Invalid(`Expected string; Received: ${JSON.stringify(e)}`);const n=checkParameterType(["number","string"],t,r);return null!==n?n:Ret.Valid(e.padStart(t,r))},padEnd:function(e,t,r=" "){if("string"!=typeof e)return Ret.Invalid(`Expected string; Received: ${JSON.stringify(e)}`);const n=checkParameterType(["number","string"],t,r);return null!==n?n:Ret.Valid(e.padEnd(t,r))},replace:function(e,t,r){if("string"!=typeof e)return Ret.Invalid(`Expected string; Received: ${JSON.stringify(e)}`);const n=checkParameterType(["string","string"],t,r);return null!==n?n:Ret.Valid(e.replaceAll(t,r))},trim:function(e){return"string"!=typeof e?Ret.Invalid(`Expected string; Received: ${JSON.stringify(e)}`):Ret.Valid(e.trim())},trimStart:function(e){return"string"!=typeof e?Ret.Invalid(`Expected string; Received: ${JSON.stringify(e)}`):Ret.Valid(e.trimStart())},trimEnd:function(e,t,r=" "){return"string"!=typeof e?Ret.Invalid(`Expected string; Received: ${JSON.stringify(e)}`):Ret.Valid(e.trimEnd())}}},float:{parse:function(e){switch(typeof e){case"boolean":return Ret.Valid(e?1:0);case"object":e=String(e);case"string":e=e.match(/[\n\r\s]+/)?NaN:Number(e).valueOf();case"number":if(!Number.isNaN(e))return Ret.Valid(e);break;case"function":case"symbol":case"undefined":default:break}return Ret.Invalid()}},bool:{parse:function(e){return Ret.Valid(Boolean(e).valueOf())}}};constructor(){this.addType({type:"int",parse:e=>{const{valid:t,value:r}=this.parse("float",e);return t&&Number.isInteger(r)?Ret.Valid(r):Ret.Invalid()}}),this.addType({type:"unsigned",parse:e=>{const{valid:t,value:r}=this.parse("int",e);return t&&r>=0?Ret.Valid(r):Ret.Invalid()}}),this.addType({type:"num",parse:e=>this.parse("float",e)}),this.addType({type:"email",name:"email(string)",parse:e=>{const{valid:t,value:r}=this.parse("string",e);if(!t)return Ret.Invalid();const n=document?.createElement("input");return null!==n?(n.type="email",n.value=r,n.checkValidity()?Ret.Valid(r):Ret.Invalid()):/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(r)?Ret.Valid(r):Ret.Invalid()}}),this.addType({type:"hex",name:"hex(string)",parse:e=>{const{valid:t,value:r}=this.parse("string",e);return t&&/^[0-9a-f]+$/i.test(r)?Ret.Valid(Number(r).valueOf()):Ret.Invalid()}}),this.addType({type:"timestamp",name:"timestamp(string)",parse:e=>{const{valid:t,value:r}=this.parse("string",e);if(!t)return Ret.Invalid();let n=new Date(r).valueOf();return NaN===n&&(n=Date.parse(r)),NaN===n?Ret.Invalid():Ret.Valid(n)}}),this.addType({type:"url",name:"url(string)",parse:e=>{const{valid:t,value:r}=this.parse("string",e);if(!t)return Ret.Invalid();try{return Ret.Valid(new URL(r).valueOf())}catch(e){return Ret.Invalid()}}}),this.addType({type:"json",name:"json(string)",parse:e=>{const{valid:t,value:r}=this.parse("string",e);if(!t)return Ret.Invalid();try{return Ret.Valid(JSON.parse(r))}catch(e){return Ret.Invalid()}}}),this.addType({type:"base64",name:"base64(string)",parse:e=>{const{valid:t,value:r}=this.parse("string",e);if(!t)return Ret.Invalid();try{return Ret.Valid(atob(r.replace(/-/g,"+").replace(/_/g,"/")))}catch(e){return Ret.Invalid()}}}),this.addRF({types:["float","num","int","unsigned"],rfName:"range",fn:function(e,t=null,r=null){return"number"!=typeof e?Ret.Invalid(`Expected number; Received: ${JSON.stringify(e)}`):null!==t&&"number"!=typeof t?Ret.Invalid(`Expected number as 1st parameter; Received: ${JSON.stringify(t)}`):null!==r&&"number"!=typeof r?Ret.Invalid(`Expected number as 2nd parameter; Received: ${JSON.stringify(r)}`):null!==t&&e<t||null!==r&&e>r?Ret.Invalid(`Expected range [${t??"null"}, ${r??"null"}]; Received: ${JSON.stringify(e)}`):Ret.Valid(e)}}),this.addRF({types:["float","num","int","unsigned"],rfName:"add",fn:function(e,t=0){if("number"!=typeof e)return Ret.Invalid(`Expected number; Received: ${JSON.stringify(e)}`);const r=checkParameterType(["number",t]);return null!==r?r:Ret.Valid(e+t)}}),this.addRF({types:["float","num","int","unsigned"],rfName:"sub",fn:function(e,t=0){if("number"!=typeof e)return Ret.Invalid(`Expected number; Received: ${JSON.stringify(e)}`);const r=checkParameterType(["number",t]);return null!==r?r:Ret.Valid(e-t)}}),this.addRF({types:["float","num","int","unsigned"],rfName:"mul",fn:function(e,t=1){if("number"!=typeof e)return Ret.Invalid(`Expected number; Received: ${JSON.stringify(e)}`);const r=checkParameterType(["number",t]);return null!==r?r:Ret.Valid(e*t)}}),this.addRF({types:["float","num","int","unsigned"],rfName:"div",fn:function(e,t=0){if("number"!=typeof e)return Ret.Invalid(`Expected number; Received: ${JSON.stringify(e)}`);const r=checkParameterType(["number",t]);return null!==r?r:0===t?Ret.Invalid("Cannot divide by zero"):Ret.Valid(e/t)}}),this.addRF({types:["float","num","int","unsigned"],rfName:"mod",fn:function(e,t=0){if("number"!=typeof e)return Ret.Invalid(`Expected number; Received: ${JSON.stringify(e)}`);const r=checkParameterType(["number",t]);return null!==r?r:0===t?Ret.Invalid("Cannot mod by zero"):Ret.Valid(e%t)}}),this.addRF({types:["float","num","int","unsigned"],rfName:"exp",fn:function(e,t=0){if("number"!=typeof e)return Ret.Invalid(`Expected number; Received: ${JSON.stringify(e)}`);const r=checkParameterType(["number",t]);return null!==r?r:Ret.Valid(e**t)}}),this.addRF({types:["float","num","int","unsigned"],rfName:"round",fn:function(e,t=2){if("number"!=typeof e)return Ret.Invalid(`Expected number; Received: ${JSON.stringify(e)}`);const r=checkParameterType(["number",t]);return null!==r?r:Ret.Valid(Number(e.toFixed(t)))}}),this.reInit()}addType({type:e,name:t=null,parse:r,rf:n=null}={}){if("string"!=typeof e||null!==t&&"string"!=typeof t||"function"!=typeof r||"object"!=typeof n)throw new Error("Invalid values in addType");this.#t[e]={parse:r},null!==t&&(this.#t[e].name=t),null!==n&&(this.#t[e].rf=n)}addRF({types:e,rfName:t,fn:r}={}){Array.isArray(e)||(e=[e]);for(const t of e)if("string"!=typeof t)throw new Error("Invalid types in addRF");if("string"!=typeof t||"function"!=typeof r)throw new Error("Invalid RF/Fn in addRF");for(const n of e){if("object"!=typeof this.#t[n])throw new Error(`Type '${n}' does not exist`);"object"!=typeof this.#t[n].rf&&(this.#t[n].rf={}),this.#t[n].rf[t]=r}}contains(e){return this.#e.types.includes(e)}containsRF(e,t,r=!0){return!(r&&!this.contains(e))&&(!!this.#e.rf.includes(`${e}.${t}`)||this.#e.rf.includes(`any.${t}`))}reInit(){this.#e={types:Object.keys(this.#t),rf:Object.entries(this.#t).map((e=>{const[t,{rf:r={}}]=e;return Object.keys(r).map((e=>`${t}.${e}`))})).flat(1)}}getType(e,t=!0){return t&&!this.contains(e)?null:this.#t[e]}getRF(e,t,r=!0){return r&&!this.containsRF(e,t)?null:Object.hasOwn(this.#t[e].rf??{},t)?this.#t[e].rf[t]:this.#t.any.rf[t]}getName(e){switch(e){case"@arr@":return"array";case"@obj@":return"object";case"@or@":return"multi-type";default:return Types.getType(e)?.name??e}}parse(e,t){return null===(e=this.getType(e))?Ret.Invalid(`Unknown type: '${e}'`):e.parse(t)}}export const Types=new TypeStore;export function logErrorTrace(...e){(new Error).stack.split("\n").shift()}function isObject(e){return null!==e&&"object"==typeof e}export class DataValidator{static New(e,...t){function r(e){switch(typeof e){case"object":return JSON.stringify(e);break;case"function":return r(e());default:return String(e)}}const n=[];for(let i=0,a=e.length-1;i<a;i++)n.push(e[i]),n.push(r(t[i]));n.push(e[e.length-1]);try{return new DataValidator(Parser.parse(n.join("")))}catch(e){throw e instanceof Parser.SyntaxError?new Error(`Parse Error; Line:${e.location.start.line}; Column:${e.location.start.column}; ${e.message}`):new Error(e.message)}}static#r(e){if(!isObject(e))return Ret.Invalid("Not an object");const{ty:t=null,rf:r=[],nxt:n=null}=e;switch(t){case null:return Ret.Invalid("Type missing");case"@arr@":{const t=e.list??[];for(const[e,r]of Object.entries(t)){const t=DataValidator.#r(r);if(!t.valid)return t.error=`[${e}]: ${t.error}`,t}}break;case"@obj@":{const t=e.list??{};for(const[e,r]of Object.entries(t)){const t=DataValidator.#r(r);if(!t.valid)return t.error=`{${e}}: ${t.error}`,t}}break;case"@or@":{const t=e.opts??{};for(const[e,r]of Object.entries(t)){const e=DataValidator.#r(r);if(!e.valid)return e.error=`{multi-type}: ${e.error}`,e}}break;default:if(!Types.contains(t))return Ret.Invalid(`Unknown type: '${t}'`);break}for(const e of r){const r=e.fn??"undefined";if(!Types.containsRF(t,r))return Ret.Invalid(`Unknown formatter: '${t}.${r}'`)}if(null!==n){const e=DataValidator.#r(n);if(!e.valid)return e.error=`${Types.getName(t)} => \n\t${e.error.replaceAll("\n","\n\t")}`,e}return Ret.Valid()}#n;constructor(e){const t=DataValidator.#r(e);if(null!==t.error)throw new Error(`TypeError: ${t.error}`);this.#n=e}validate(e){return DataValidator.#i(e,this.#n)}static#a(e){e.idx=-1,e.len=e.length-1,e.more=0,e.next=function(e=!1){return 0===this.more?(this.idx++,this.more="reset",this.idx>this.len?"error":this.next()):"reset"===this.more?(this.more=this[this.idx].more??1,this.next(e)):"many"===this.more?e?this.idx===this.len?"error":(this.more=0,this.next(e)):this[this.idx]:(this.more--,this[this.idx])}}static#i(e,t){const{ty:r=null,rf:n=[],nxt:i=null}=t;switch(r){case"@arr@":{if(!Array.isArray(e))return Ret.Invalid(`Expected array; Received ${JSON.stringify(e)};`);const r=[],n=t.list??[];DataValidator.#a(n);let i=n.next();const a=Object.entries(e);for(let e=0,t=a.length;e<t;e++){const[t,s]=a[e];if("error"===i)return Ret.Invalid(`[${t}] Index out of bounds`);let l=DataValidator.#i(s,i);if(!l.valid){if("many"===n.more&&n.idx!==n.len){i=n.next(!0),e--;continue}return Ret.Invalid(`[${t}]: ${l.error}`)}r.push(l.value),i=n.next()}e=r}break;case"@obj@":{if(!isObject(e))return Ret.Invalid(`Expected object; Received ${JSON.stringify(e)};`);const r=t.list??{},n=Object.keys(r);{const t=((e,t)=>{const r=[];for(const n of e)t.includes(n)||r.push(`{${n}}`);return r})(n.filter((e=>!r[e].opt)),Object.keys(e));if(0!==t.length)return Ret.Invalid(`Missing object key(s): ${t.join(", ")}; Received ${JSON.stringify(e)};`)}const i=t.keep_extra??!1,a={};for(const[t,s]of Object.entries(e))if(n.includes(t)){const e=DataValidator.#i(s,r[t]);if(!e.valid)return Ret.Invalid(`{${t}}: ${e.error}`);a[t]=e.value}else i&&(a[t]=s);e=a}break;case"@or@":{const r=t.opts??[];let n=null;for(const t of r)if(n=DataValidator.#i(e,t),n.valid)break;if(null===n||!n.valid)return Ret.Invalid(`Expected type(s): (${r.map((e=>e.ty??"undefined")).join("|")}); Received: ${JSON.stringify(e)};`);e=n.value}break;default:{let t=Types.parse(r,e);if(!t.valid)return Ret.Invalid(`Expected type: ${Types.getName(r)}; Received: ${JSON.stringify(e)};`);e=t.value}break}for(const t of n){let{fn:n="undefined",args:i=[]}=t,a=Types.getRF(r,n,!1)(e,...i);if(!a.valid)return a.error??=`Cannot convert ${JSON.stringify(e)};`,Ret.Invalid(`Formatter '${Types.getName(r)}.${n}' error: ${a.error}`);e=a.value}if(null!==i){const t=DataValidator.#i(e,i);if(!t.valid)return t.error=`${Types.getName(r)} => \n\t${t.error.replaceAll("\n","\n\t")}`,t;e=t.value}return Ret.Valid(e)}}