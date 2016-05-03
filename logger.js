define(function(require, exports, module){
    "use strict";
    
    main.consumes = ["Plugin","fs","auth","tabManager","save"];
    main.provides = ["logger"];
    return main;
    
    function main(options,imports,register){
	    var Plugin = imports.Plugin;
	    var fs = imports.fs;
	    var tabManager = imports.tabManager;
	    var save = imports.save;
	    var path = require("path");
	    var auth=imports.auth;
        var loggers = {};
        var logpath="~/.sel4log"
        //initialization
        var plugin = new Plugin("heroism.1993",main.consumes);
        var emit = plugin.getEmitter();
	    var loaded = false;
	    Date.prototype.Format = function(fmt)
        { //author: meizz   
          var o = {   
            "M+" : this.getMonth()+1,                 //月份   
            "d+" : this.getDate(),                    //日   
            "h+" : this.getHours(),                   //小时   
            "m+" : this.getMinutes(),                 //分   
            "s+" : this.getSeconds(),                 //秒   
            "q+" : Math.floor((this.getMonth()+3)/3), //季度   
            "S"  : this.getMilliseconds()             //毫秒   
          };   
          if (/(y+)/.test(fmt))   
            fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));   
          for (var k in o)   
            if (new RegExp("("+ k +")").test(fmt))   
          fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));   
          return fmt;   
        }
	    //class logger
	    function logger(logfile,name)
	    {
	        console.log("New logger "+name+".\n");
	        this.logfile=path.normalize(logfile);
	        this.name=name;
	        this.startDate=new Date();
	        this.info=function(content){
	            log(content,"info");
	        }
	        this.trace=function(content){
	            log(content,"trace");
	        }
	        this.warn=function(content){
	            log(content,"warn");
	        }
	        this.error=function(content){
	            log(content,"error");
	        }
	        this.debug=function(content){
	            log(content,"debug");
	        }
	        function log(content,level)
	        {
	            var d = (new Date()).Format("yyyy-MM-dd hh:mm:ss.S");
	            var c = '['+d+'] ['+level+'] '+name+' - '+content+'\n';
	            fs.appendFile(logfile,c,function(){
	                console.log('logger output.');
	            });
	        }
	    }
	    
        function load(){
            if (loaded) return false;
            loaded = true;

        }
        
        function unload() {
            loaded = false;
        }
        
        function getLogger(name){
            if (loggers.hasOwnProperty(name)) {
                return loggers[name];
            }
            addLogger(name);
            return loggers[name];
        }
        
        /**** Logging Tab ****/
        var tablogger = getLogger("Tab");
        var templateHandle=function(e,event){
            var info=e.tab.path;
              if (info === undefined){
                  info=e.tab.tooltip;
              }
              tablogger.info(event+' '+info);
        }
        var tabhandlelist={
          "focus":function(e){
              templateHandle(e,"focus");
          },
          "tabAfterClose":function(e){
              templateHandle(e,"tabAfterClose");
          },
          "open":function(e){
              templateHandle(e,"open");
          },
          "tabDestroy":function(e){
              templateHandle(e,"tabDestroy");
          },
          "tabCreate":function(e){
              templateHandle(e,"tabCreate");
          }
        };
        
        for (var key in tabhandlelist){
            tabManager.on(key,tabhandlelist[key]);
        }
        /**** End logging Tab ****/
        
        /**** Logging file save ****/
        save.on("afterSave",function(e){
            tablogger.info("save "+e.path);
        });
        save.on("saveAs",function(e) {
            tablogger.info("saveAs from "+e.oldPath+" to "+e.path);
        });
        /**** End logging file save ****/
        
        auth.on("login",function(e){
            console.log(e.uid+" logging.")
        });
        
        
        
        function setLogpath(p){
            this.logpath = p;
            for (var key in loggers){
                delete loggers[key];
                addLogger(key);
            }
        }
        
        function addLogger(name){
            emit("beforeAddlogger",name);
            var log=new logger(path.join(logpath,name+".log"),name);
            emit("afterAddlogger",name);
            loggers[name]=log;
        }
        
        plugin.on("load", load);
        plugin.on("unload", unload);
        plugin.on("disable",function() {
            
        });
        plugin.on("enable",function() {
            
        });
        
        plugin.freezePublicAPI({
            
            _events: [
                /**
                 * Fires before a new logger is added.
                 * @event beforeAddlogger
                 * @param {String} the name of the new logger.
                 */
                "beforeAddlogger",
                /**
                 * Fires after a new logger is added.
                 * @event afterAddlogger
                 * @param {String} the name of the new logger.
                **/
                "afterAddlogger"
                ],
            /**
             * Returns the logger you named, if not existed, create one.
             * @param {String} the name of logger
             * @return {Object} the logger
             */
             getLogger: getLogger,
             
            /**
             * Set the log path to a new one.
             * @param {String} the new path.
             */
             setLogpath: setLogpath
        });
        
        register(null,{
            "logger": plugin
        });
    }
    
});
