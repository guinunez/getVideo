// ==UserScript==
// @name getVideos
// @author Luis Guillermo Nuñez 
// @namespace http://userjs.org/ 
// @version 1.2.2
// @description The script detects flv videos on a website and build links to let you download the videos on flv or other formats.
// @ujs:category browser: enhancements
// ==/UserScript==

/*
 * License: E-mailware, send me an e-mail if you use it.
 *          You can modify it, adapt it, anything you like,
 *          as long as you put my name somewhere
 */

/*
 * Long description:
 *    This script detects flash .flv movies and
 *    adds download links at the bottom of that movie,
 *    it currently supports youtube videos with multiple
 *    download formats, and generic .flv movies.
 *
 *    tested on:
 *    - flv-player videos (http://flv-player.net/) and opensource
 *    - flv player (http://www.trenttompkins.com/Downloads/OpenSource-FLV-Player.html)
 *    - dailymotion
 *    - shiftdelete
 *    - trilulilu
 *    - and of course, youtube.com
 *
 *
 *    Known Issues:
 *    - Sometimes you have to download the video via 
 *      right click > Save linked content as ... (I am not sure why this is necesary,
 *      probably opera is trying to handle the mime tipe?)
 *    - Sometimes it crash some versions of Opera 10.52 (at least on Linux)
 *
 *    Future development:
 *      I will add more players depending on the demand and difficulty.
 *      I want to add online transcoding services to allow download
 */


function videoReplaceHTML(videourl, type) {
	if(!type) type = 'video/flv';
	return'<object type="'+type+'" data="'+videourl+'" width="500" height="400"><param name="autoplay" value="false" /><param name="autoStart" value="0" /><param name="src" value="'+videourl+'" />Your browser doesn\'t seem to support this video, please use the download link below.</object>';
}

function videoURLDecode(psEncodeString) 
{
  // Create a regular expression to search all +s in the string
  var lsRegExp = /\+/g;
  // Return the decoded string
  return unescape(String(psEncodeString).replace(lsRegExp, " ")); 
}

document.addEventListener("DOMContentLoaded", function(){

  var videoActions = new Array();
  var linksContainer = false;
  var videoFound = false;
  
  /*
   * Youtube specific
   */
  if( location.hostname.indexOf('youtube.com') != -1  && (location.href.indexOf('youtube.com/watch') != -1)) {

    var divYoutubeContainer = 'watch-player';
    if(document.getElementById('watch-player') && document.getElementById('watch-player').getElementsByTagName('embed')[0]) {
      divYoutubeContainer = 'watch-player';
    }

    if(document.getElementById('watch-player-div') && document.getElementById('watch-player-div').getElementsByTagName('embed')[0]) {
      divYoutubeContainer = 'watch-player-div';
    }

    if(document.getElementById(divYoutubeContainer) && document.getElementById(divYoutubeContainer).getElementsByTagName('embed')[0]) {

      var url = document.getElementById(divYoutubeContainer).getElementsByTagName('embed')[0].getAttribute("flashvars", 0);
      var originalQuery = url.toString().split("?");

      var usingStreamVars = false;

      var variablesURL = Array();
      variablesURL = originalQuery.toString().split("&");
      var queryArray = new Array();
      for(var j = 0, variableURL; variableURL = variablesURL[j]; j++ ) {

        var pair = variableURL.split("=");
        if (pair[0] == 'video_id') {
          queryArray.push('video_id=' + pair[1]);
        }

        if (pair[0] == 't') {
          queryArray.push('t=' + pair[1]);
        }


        /*
         * Required for Youtube version 2010 
         */
        if(pair[0] == 'fmt_stream_map') {
          usingStreamVars = true;
          stringStream = videoURLDecode(pair[1]);
          var variablesStream = Array();
          variablesStream = stringStream.toString().split(",");
          for(var k = 0, variableStream; variableStream = variablesStream[k]; k++ ) {
            var pairStream = variableStream.split('|');
            opera.postError(variableStream);

            switch(pairStream[0]) {
              case '34':  // 360p
                videoActions.push({url: pairStream[1], file_type: '360p flv'});
                break;
              case '35':  // 480p
                videoActions.push({url: pairStream[1], file_type: '480p flv'});
                break;
              case '22':  // 720p
                videoActions.push({url: pairStream[1], file_type: '720p mp4 HD'});
                break;
              case '5':  // 240p
                videoActions.push({url: pairStream[1], file_type: '240p flv'});
                break;
              case '18':  // 360p
                videoActions.push({url: pairStream[1], file_type: '360p mp4'});
                break;
              case '37':  // 240p
                videoActions.push({url: pairStream[1], file_type: '1080p mp4 HD'});
                break;
              
            }


          }
          linksContainer = document.getElementById('watch-video');

        }


      }
      query = queryArray.join('&')
    }




    if (!usingStreamVars) {
      videoActions[0] = {url: "http://www.youtube.com/get_video?" + query, file_type: 'flv'};
      videoActions[1] = {url: "http://www.youtube.com/get_video?fmt=18&" + query, file_type: 'mp4'};
      videoActions[2] = {url: "http://www.youtube.com/get_video?fmt=17&" + query, file_type: '3gp'};
      videoActions[3] = {url: "http://www.youtube.com/get_video?fmt=6&" + query, file_type: 'hq flv', notes: 'It may not work'};
      linksContainer = document.getElementById(divYoutubeContainer);
    }
    videoFound = true;


  }

  /*
   * DailyMotion
   */
  if( location.hostname.indexOf('dailymotion.com') != -1 ) {
    var dailymotionEmbMedia=document.getElementsByTagName('embed');
    for(var i = 0, embItem; embItem = dailymotionEmbMedia[i]; i++ ) {
      /*
      * Search for flv file requests
      */
      var flashVar=unescape(embItem.getAttribute('flashvars'));
      if(flashVar.indexOf('.flv') != -1) {
        var variablesURL = Array();
        variablesURL = flashVar.toString().split("&");
        for(var j = 0, variableURL; variableURL = variablesURL[j]; j++ ) {
          if (variableURL.indexOf('.flv') != -1) {
	    videoActions[0] = {url: variableURL.substring(6), file_type: 'flv'};
            videoFound = true;

            linksContainer = embItem.parentNode;

            break;
          }

        }

      }
    }
  }


  /*
   * trilulilu
   */
  if( location.hostname.indexOf('trilulilu.ro') != -1 ) {
    if(typeof(current_hash) != 'undefined' && typeof(current_file) != 'undefined') {
      var variableURL = 'http://fs' + current_file.server + '.trilulilu.ro/stream.php?type=video&hash=' + current_hash;

      videoActions[0] = {url: variableURL, file_type: 'flv'};
      videoFound = true;

      linksContainer = document.getElementById('viewfileswf');

    } else {
      var triluliluEmbMedia=document.getElementsByTagName('embed');
      for(var i = 0, embItem; embItem = triluliluEmbMedia[i]; i++ ) {
        /*
        * Search for flv file requests
        */
        var flashVar=unescape(embItem.getAttribute('src'));
        if(flashVar.indexOf('hash') != -1 && flashVar.indexOf('@@') == -1) {

          var variablesURL = Array();
          var movieServer;
          variablesURL = flashVar.toString().split("&");
          for(var j = 0, variableURL; variableURL = variablesURL[j]; j++ ) {
            var pair = variableURL.split("=");
            if (pair[0] == 'hash') {

              for( var k = 0, variableServer; variableServer = files_js[k]; k++) {
          if(files_js[k].hash = pair[1]) {
            
            movieServer = files_js[k].server
            break;
          }
              }

              videoActions[0] = {url: 'http://fs' + movieServer + '.trilulilu.ro/stream.php?type=video&hash=' + pair[1], file_type: 'flv'};
              videoFound = true;

              linksContainer = embItem.parentNode.parentNode;

              break;
            }


          }

        }
      }
    }
  
  }

  /*
   * shiftdelete
   */
  if( location.hostname.indexOf('shiftdelete.net') != -1 ) {
    var className = 'sdnPlayer';
    var shiftdeleteUrlContainers = document.getElementsByClassName(className);
    for(var j = 0, shiftdeleteUrlContainer; shiftdeleteUrlContainer = shiftdeleteUrlContainers[j]; j++ ) {
      videoActions[0] = {url: shiftdeleteUrlContainer.href, file_type: 'mp4'};
      videoFound = true;

      linksContainer = shiftdeleteUrlContainer.parentNode;

      break;


    }
  }


  /*
   * facebook
   */
  if( location.hostname.indexOf('facebook.com') != -1 ) {
//1368527222585_43662.mp4
    var className = 'mvp_player player_left';
    var facebookVideoContainers=document.getElementsByClassName(className);

  //  opera.postError(document.getElementsByTagName('embed')[0]);
    facebookContainer = facebookVideoContainers[0];
  //  opera.postError(document.getElementsByTagName('embed')[0].getAttribute("flashvars", 0));

    for(var i = 0, facebookContainer; facebookContainer = facebookVideoContainers[i]; i++ ) {
      /*
      * Search for embed
      */
/*      opera.postError('buscamos Container');
      var facebookEmbMedia=facebookContainer.getElementsByTagName('embed');
opera.postError(facebookVideoContainers[0]);
      for(var j = 0, embItem; embItem = facebookEmbMedia[j]; j++ ) {

        var flashVar=unescape(embItem.getAttribute('flashvars'));
opera.postError(flashVar);
        if(flashVar.indexOf('video_src') != -1) {
          var variablesURL = Array();
          variablesURL = flashVar.toString().split("&");
          for(var k = 0, variableURL; variableURL = variablesURL[k]; k++ ) {
            var pair = variableURL.split("=");
            if (pair[0] == 'video_src') {
              videoActions[0] = {url: pair[1], file_type: 'mp4'};
              videoFound = true;

              linksContainer = facebookContainer;

              break;
            }

          }

          if(videoFound) {
            break;
          }

        }
      }*/
    }
  }

  /*
   * Generic flash player using embed
   */
  if (!videoFound) {
    var genericEmbMedia=document.getElementsByTagName('embed');
    for(var i = 0, embItem; embItem = genericEmbMedia[i]; i++ ) {
      /*
      * Search for flv file requests
      */
      var flashVar=unescape(embItem.getAttribute('flashvars'));
      if(flashVar.indexOf('.flv') != -1) {
        var variablesURL = Array();
        variablesURL = flashVar.toString().split("&");
        for(var j = 0, variableURL; variableURL = variablesURL[j]; j++ ) {
          var pair = variableURL.split("=");
          if (variableURL.indexOf('.flv') != -1) {
            videoActions[0] = {url: pair[1], file_type: 'flv'};
            videoFound = true;

            linksContainer = embItem.parentNode;

            break;
          }

        }

      }
    }
  }


  /*
   * Generic flash player using object
   */
  if (!videoFound) {
    var genericParamMedia=document.getElementsByTagName('param');
    for(var i = 0, paramItem; paramItem = genericParamMedia[i]; i++ ) {
      /*
      * Search for flv file requests
      */
      var flashVar=unescape(paramItem.getAttribute('value'));

      if(flashVar.indexOf('.flv') != -1) {
        var variablesURL = Array();
        variablesURL = flashVar.toString().split("&");
        for(var j = 0, variableURL; variableURL = variablesURL[j]; j++ ) {
          var pair = variableURL.split("=");
          if (variableURL.indexOf('.flv') != -1) {
            videoActions[0] = {url: pair[1], file_type: 'flv'};
            videoFound = true;

            linksContainer = paramItem.parentNode.parentNode;

            break;
          }

        }

      }

      if(videoFound == true)
        break;

    }
  }

  if (linksContainer) {
    var header = document.createElement('h5');
    header.appendChild(document.createTextNode("Download this Video as"));
    var linkList = document.createElement('ul');
    linkList.style.padding = "0px";
    for(var i = 0, videoAction; videoAction = videoActions[i]; i++ ) {
      var linkItem = document.createElement('li');
      var linkVideo = document.createElement('a');
      linkVideo.href=videoAction.url;
      var txt = document.createTextNode(videoAction.file_type);
      linkVideo.appendChild(txt);
      linkItem.appendChild(linkVideo);
      linkItem.style.display = 'inline';
      linkItem.style.margin = '0px 5px'
      linkList.appendChild(linkItem);
      linkList.style.display = 'inline';
      linkVideo.title = 'use right click to download';
//      linkVideo.type = 'video/x-flv';
    }


    header.style.display = 'inline';

    var containerBlock = document.createElement('div');

    containerBlock.appendChild(header);
    containerBlock.appendChild(linkList);

/*
 * Uncomment the lines below in order to test non-flash player
 */
//    var plugin_embed = document.createElement('div');
//    plugin_embed.innerHTML = videoReplaceHTML(videoActions[0].url, 'video/flv');
//    containerBlock.appendChild(plugin_embed);

    linksContainer.appendChild(containerBlock);
  }

}, false );



