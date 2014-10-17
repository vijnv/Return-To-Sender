// Only run this script in the top-most frame (there are multiple frames in Gmail)
if (top.document == document) {
     
    var scripts = {
        "rts-jquery": "js/lib/jquery-2.1.1.min.js",
        "rts-gmailjs": "js/lib/gmail.min.js",
        "rts-main": "js/main.js"
    }
    
    // Loads a script
    var loadScript = function(id, path) {
        var headID = document.getElementsByTagName("head")[0];
        var newScript = document.createElement('script');
        newScript.type = 'text/javascript';
        if (path.indexOf("http") < 0) { 
            newScript.src = chrome.extension.getURL(path);
        } else {
            newScript.src = path;
        }
        newScript.id = id;
        newScript.dataset.loaded = 0;
        headID.appendChild(newScript);
    };
    
    var waitFor = function(it, next) {
        if (document.getElementById(it).dataset.loaded == 1) {
            load(next);
        } else {
            setTimeout(function(){ waitFor(it, next) }, 50);
        }
    }
    
    var load = function(i) {
        scriptids = Object.keys(scripts);
        if (i < scriptids.length) {
            var id = scriptids[i];
            var path = scripts[id];
            loadScript(id, path);
            i++;
            if (i !== scriptids.length) {
                waitFor(id, i);
            }
        }
    }
    
    load(0);
}