
/*
Author          :   Navneet Kumar
Created  Date   :   14-11-2008
Modified Date   :   19-02-2009
version         :   1.0
*/

/* Requires Prototype.js */

var JSConsole = (function() {
                 var currObj;
                 var currErr;
                 var currCmd;
                 var cmdHistory = $A([]);
                 var cmdNo = -1;
                 var logArea;
                 var count = 0;
                 var callBackArray = $A([]);
                 var lineNo = 0;
                 // methods
                 function toString() { return "JSConsole Object."; }
                 function log(str, styles, noBreak, logHere) {
                     var consoleScreen = $(logHere) || logArea;
                     if (consoleScreen){
                         var str_with_br = "" +str;
                         try {
                             str_with_br = $A(str_with_br.split(',')).join(', ');
                         }
                         catch(e) {
                             str_with_br = str;
                         }

                         lineNo++;
                         if(styles) {
                             str_with_br = "<span id='lineNo_"+lineNo+"' style='"+styles+"'>" + str_with_br + "</span>";
                         }
                         else {
                             str_with_br = "<span id='lineNo_"+lineNo+"'>" + str_with_br + "</span>";
                         }

                         str_with_br = (noBreak === true) ? str_with_br : str_with_br + "<br/>";

                         consoleScreen.innerHTML += str_with_br;
                         consoleScreen.scrollTop = 100000; // HACK: any large no for scrollTop will scroll the div to the bottom
                     }
                 }
                 function loge(error) {
                     currErr = error;
                     var err = "Error: ";
                     if(error.stack) {
                         err += "<a href='javascript:void(0)' onclick='javascript:JSConsole.showError();'" + "><span style='text-decoration: underline;'>" + error.message + "</span></a>";
                     }
                     else {
                         err += error.message;
                     }
                     log(err, 'color: red; font-weight: bold;');
                 }
                 function logf(fc, fcName) {
                     var func = (function() { return function() {
                                 try { prettyPrintFunction(fc); }
                                 catch(e) { loge(e); }
                     }})();
                     callBackArray.push(func);
                     var idx = callBackArray .length -1;
                     var funcDef = (""+fc).split("{")[0];
                     var val = "<a href='javascript:void(0)' onclick='javascript: JSConsole.explode("+idx+", \""+fcName+"\");'> <span style='font-weight:bold; text-decoration: underline;'> "+funcDef+" </span></a>";
                     log(val, 'color: green; font-weight: bold;');
                 }
                 function logO(obj, objName) {
                     var func = (function() { return function() {
                                 try { dir(obj); }
                                 catch(e) { loge(e); }
                     }})();
                     callBackArray.push(func);
                     var idx = callBackArray .length -1;
                     var val = "<a href='javascript:void(0)' onclick='javascript: JSConsole.explode("+idx+");'> <span style='font-weight:bold; text-decoration: underline;'> "+obj+" </span></a>";
                     log(val, 'color: green; font-weight: bold;');
                 }
                 function logHTML(htmlElem) {
                     htmlElem = $(htmlElem);
                     var func = (function() { return function() {
                                 try { log(htmlElem); }
                                 catch(e) { loge(e); }
                     }})();
                     var func = (function() { return function() { getHTML(htmlElem); }})();
                     callBackArray.push(func);
                     var idx = callBackArray .length -1;
                     var val = "<a href='javascript:void(0)' onclick='javascript: JSConsole.explode("+idx+");'> <span style='font-weight:bold; text-decoration: underline;'> "+htmlElem+" </span></a>";
                     log(val, 'color: green; font-weight: bold;');
                 }
                 function prettyPrintFunction(funcRef) {
                     var funcText   = funcRef.toString();
                     funcText = funcText.replace(/\/\/ No I18N/g, "");
                     funcText       = funcText.replace(/for \(/g, "for(");
                     var textArr    = funcText.toArray();
                     var indent     = 0;
                     var line       = '';
                     var currChar   = '';
                     var prevChar   = '';
                     var prev2Char  = '';
                     var prev3Char  = '';
                     var escapeNewLine = false;
                     for(var i=0; i< textArr.length; i++) {
                         prev3Char  = prev2Char;
                         prev2Char  = prevChar;
                         prevChar   = currChar;
                         currChar   = textArr[i];

                         if(prev3Char == 'f' && prev2Char == 'o' && prevChar == 'r' && currChar == '(') {
                             escapeNewLine = true;
                         }

                         if(currChar == ';' && !escapeNewLine) {
                             line += currChar;
                             log(line.escapeHTML(), "padding-left: "+indent+";\"");
                             line = '';
                         }
                         else if(currChar == ')') {
                             line += currChar;
                             escapeNewLine = false;
                         }
                         else if(currChar == '{') {
                             line += currChar;
                             log(line, "padding-left: "+indent+";\"");
                             indent += 8;
                             line = '';
                             escapeNewLine = false;
                         }
                         else if(currChar == '}') {
                             if(line.replace(/^\s*|\s*$/g, '') != '') { // in case statement not terminated by a semi-colon
                                 log(line, "padding-left: "+indent+";\"");
                             }
                             indent -= 8;
                             log("}", "padding-left: "+indent+";\"");
                             line = '';
                         }
                         else {
                             line += currChar;
                         }
                     }
                     textArr = null;
                 }
                 function expandErr(err) {
                     var msg = currErr.stack //err.stack;
                     msg = msg.split('@').join("<br/>");
                     log(msg, 'color: red')
                 }
                 function evalScript() {
                     var cmd = $('cmdBox').value;
                     currCmd = cmd;
                     setHistory(cmd);
                     try {
                         var result = eval(cmd);
                         log(">>> " + cmd.escapeHTML());
                         if(objectof(result) == "Function"){
                             logf(result, cmd);
                         }
                         else if(objectof(result) == "Array") {
                             log("["+result+"]");
                         }
                         else if(objectof(result) == "Object") {
                             logO(result);
                         }
                         else if(objectof(result) == "HTML") {
                             logHTML(cmd);
                         }
                         else {
                             log(result);
                         }
                     }
                     catch(e) {
                         loge(e);
                     }
                 }
                 function setHistory(cmd) {
                     if(cmdHistory.include(cmd)) {
                         var idx = cmdHistory.indexOf(cmd);
                         cmdHistory.remove([cmd]);
                     }
                     cmdHistory.push(cmd);
                     cmdNo = cmdHistory.length - 1;
                 }
                 function getPrevCmd() {
                     cmdNo = cmdNo -1;
                     if(cmdNo < 0) { cmdNo = 0; }
                     $('cmdBox').value = cmdHistory[cmdNo];
                 }
                 function getNextCmd() {
                     cmdNo = cmdNo + 1;
                     if(cmdNo >= cmdHistory.length) { cmdNo = cmdHistory.length - 1; }
                     $('cmdBox').value = cmdHistory[cmdNo];
                 }
                 function clearScriptText(event) {
                     if($('cmdBox').value == "Enter your script") { $('cmdBox').value =''; }
                 }
                 function clearConsole() {
                     logArea.update("");
                     callBackArray = null;
                     callBackArray = $A([]);
                     lineNo = 0;
                 }
                 function checkKeyUp(event) {
                     if(event.keyCode == Event.KEY_RETURN)       { evalScript(); }
                     else if(event.keyCode == Event.KEY_UP)      { getPrevCmd(); }
                     else if(event.keyCode == Event.KEY_DOWN)    { getNextCmd(); }
                     //else { log(event.keyCode); }
                 }
                 function getHTML(elmNodeOrHTMLStr) {
                     var html_src = "";
                     html_src += elmNodeOrHTMLStr.outerHTML || elmNodeOrHTMLStr;
                     //html_src = stripTags(html_src);
                     return html_src.escapeHTML();
                 }
                 function dir(obj, logHere) {
                     //log("in dir "+this);
                     currObj = obj;
                     if(objectof(currObj) == "Function") {
                         var comp = Object.keys(currObj).zip(Object.values(currObj)) ;
                         comp.each(function (c) {
                                   //window.console.debug("objectof = ", objectof(obj[c[0]]), typeof(obj[c[0]]), obj[c[0]].constructor, obj[c[0]].prototype);
                                   //log(c);
                                   var key = c[0] + "";
                                   log(key , 'color:green; font-weight:bold;', true);
                                   log(" => ", null, true);
                                   var val = undefined;
                                   if(objectof(c[1]) == "Object") {
                                       //val = "<a href='javascript:void(0)' onclick='javascript: (function() {);})();'> <span style='font-weight:bold; text-decoration: underline;'>" +c[1]+ "</span></a>";
                                       //log(val);
                                       logO(c[1]);
                                   }
                                   else {
                                       val = (c[1]) ? c[1].toString().truncate(100) : 'NULL';
                                       log(val);
                                   }
                         });
                     }
                     else if(objectof(currObj) == "Object") {
                         var key, val, i;
                         for(i in currObj) {
                             //window.console.debug("objectof = ", objectof(i), typeof(i), i.constructor, i.prototype);
                             //log(objectof(s[i]))
                             if(objectof(currObj[i]) == "Object") {
                                 key = i;
                                 var func = (function(o, p) { return function() {
                                             try {
                                                 dir(o[p], 'div_exp_'+callBackArray.length);
                                             }
                                             catch(e) { loge(e); }
                                 }})(obj, i);
                                 callBackArray.push(func);
                                 var idx = callBackArray.length-1;
                                 //var div_id = (function() { return 'div_exp_'+idx ; })();
                                 val = "<a href='javascript:void(0)' onclick='javascript: JSConsole.explode("+idx+", \""+key+"\");'> <span style='font-weight:bold; text-decoration: underline;'>" +currObj[i]+ "</span></a><div id='div_exp_"+idx+"' style='display:none'></div";
                             }
                             else {
                                 key = i;
                                 val = currObj[i];
                             }
                             //window.console.debug("key = ",key);
                             log(key , 'color:green;', true);
                             log(" => ", null, true);
                             if(objectof(currObj[i]) == "Function") {
                                 logf(val, key);
                             }
                             else if(objectof(currObj[i]) == "Array") {
                                 log("["+val+"]");
                             }
                             else {
                                 log(val);
                             }
                         }
                     }
                     /* else if(objectof(currObj) == "Error") { } */
                     else {
                         var comp = Object.keys(JSConsole.currObj).zip(Object.values(JSConsole.currObj)) ;
                         comp.each(function (c) {
                                   var key = c[0];
                                   log(key , 'color:green; font-weight:bold;', true);
                                   log(" => ", null, true);
                                   var val = (c[1]) ? c[1].toString().truncate(100) : 'NULL';
                                   log(val);
                         });
                     }
                 }
                 function explode(idx, name) {
                     try {
                         var name = name || "anonymous";
                         log("==== "+name+" ====", 'color:green; font-weight:bold;');
                         var func = callBackArray[idx];
                         func.apply(JSConsole, []);
                         log("");
                         //$('div_exp_'+idx).update("test").show();
                     }
                     catch(e) {
                         loge(e);
                     }
                 }
                 function keys(obj) {
                     return $A(Object.keys(obj));
                 }
                 function objectof(object) {
                     if(object && object.constructor) {
                         var className = object.constructor.toString().match(/function\s*(\w+)/);
                         if(className) {
                             return className.last();
                         }
                         else {
                             return object.constructor;
                         }
                     }
                     return null;
                 }
                 function initSDC() {
                     var div_src = document.createElement('DIV');
                     var div_html = "<div style='margin:10; padding:5'><table width=\"100%\"><tbody><tr><td><button onclick=\"JSConsole.clearConsole();\" accesskey=\"c\" name=\"clear\"><span style=\"text-decoration: underline;\">C</span>lear</button>&nbsp;<input type=\"text\" onclick=\"JSConsole.clearScriptText();\" style=\"width: 850px;\" value=\"Enter your script\" name=\"evalText\" id=\"cmdBox\"/>&nbsp;<input type=\"button\" onclick=\"window.JSConsole.evalScript();\" value=\"Run\" name=\"eval\"/> </td> </tr> <tr> <td> <div style=\"border-style: ridge; overflow: auto; width: 1000px; float: left; height: 350px;\" id=\"log\"> </div></td> </tr> </tbody></table></div>";

                     div_src.innerHTML = div_html;
                     document.body.appendChild(div_src);
                     logArea = $('log');
                     var bRunCmd = window.JSConsole.checkKeyUp.bindAsEventListener(window.JSConsole);
                     Event.observe($('cmdBox'), 'keypress', bRunCmd);
                 }
                 // public
                 return {
                     log: log,
                     dir: dir,
                     keys: keys,
                     getHTML: getHTML,
                     checkKeyUp: checkKeyUp,
                     clearScriptText: clearScriptText,
                     clearConsole: clearConsole,
                     evalScript: evalScript,
                     showError: expandErr,
                     explode: explode,
                     initSDC: initSDC
                 };
})();

window.sdlog = JSConsole.log;


Array.prototype.remove = function(array) {
    if(array.length) {
        var i=0;
        while( i < array.length) {
            var j=0;
            while( j < this.length) {
                if(this[j] == array[i]) {
                    this.splice(j, 1);
                }
                else {
                    j++;
                }
            }
            i++;
        }
    }
    return this;
}

Event.observe(window, 'load',  JSConsole.initSDC);


/* ############################################################ */

/* function initSDC() {
    var div_src = document.createElement('DIV');
    var div_html = "<div style='margin:10; padding:5'><table width=\"100%\"><tbody><tr><td><button onclick=\"$('log').update('');\" accesskey=\"c\" name=\"clear\"><span style=\"text-decoration: underline;\">C</span>lear</button>&nbsp;<input type=\"text\" onclick=\"JSConsole.clearScriptText();\" style=\"width: 850px;\" value=\"Enter your script\" name=\"evalText\" id=\"cmdBox\"/>&nbsp;<input type=\"button\" onclick=\"window.JSConsole.evalScript();\" value=\"Run\" name=\"eval\"/> </td> </tr> <tr> <td> <div style=\"border-style: ridge; overflow: auto; width: 1000px; float: left; height: 350px;\" id=\"log\"> </div></td> </tr> </tbody></table></div>";

    div_src.innerHTML = div_html;
    document.body.appendChild(div_src);
    JSConsole.logArea = $('log');
    var bRunCmd = window.JSConsole.checkKeyUp.bindAsEventListener(window.JSConsole);
    Event.observe($('cmdBox'), 'keypress', bRunCmd);
    // Commands
    dir = JSConsole.dir.bind(JSConsole);
    keys = JSConsole.keys.bind(JSConsole);
    showError =  JSConsole.expandError.bind(JSConsole);
    showObject = JSConsole.expandObject.bind(JSConsole);
    getHTML = JSConsole.getHTML.bind(JSConsole);
}
 */


/*
    <div>
      <table width="100%">
        <tbody><tr>
          <td>
            <button onclick="$('log').update('');" accesskey="c" name="clear"> <span style="text-decoration: underline;">C</span>lear</button> 
            <input type="text" onclick="clearScriptText();" style="width: 750px;" value="Enter your script" name="evalText" id="evaluate"/>
            <input type="button" onclick="evalScript();" value="Run" name="eval"/>
          </td>
        </tr>
        <tr>
          <td>
            <div style="border-style: ridge; overflow: auto; width: 1000px; float: left; height: 350px;" id="log" runat="server">
          </div></td>
        </tr>
      </tbody></table>
    </div> */

