/*
  udacity-dl - Udacity Video Downloader

  Written in 2012 by Greg Inozemtsev <greg@nzmsv.com>

  To the extent possible under law, the author(s) have dedicated all
  copyright and related and neighboring rights to this software to
  the public domain worldwide. This software is distributed without
  any warranty.

  You should have received a copy of the CC0 Public Domain Dedication
  along with this software. If not, see
  <http://creativecommons.org/publicdomain/zero/1.0/>.
*/

;(function(window)
{
	//API version
	var udacity_version_verified = 'dacity-104';

	var document = window.document;

	function udacityAjax(request, type, callback)
	{
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function(data) {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					var data = JSON.parse(xhr.responseText);
					callback(data);
				} else {
					callback(null);
				}
			}
		}
		var url = 'http://www.udacity.com/ajax?' + encodeURIComponent(request);
		xhr.open('GET', url, true);
		//must include content-type header
		xhr.setRequestHeader("Content-Type", type);
		xhr.send();
	};


	function getUnit(data)
	{
		var version_warning = document.createElement('div');
		{
			version_warning.appendChild(document.createTextNode("This new version of Udacity has not yet been tested with the download helper extension. "));
			version_warning.setAttribute('style', 'padding-top: 10px; padding-right: 10px; padding-bottom: 10px; padding-left: 10px; text-align: center; color: black; background-color: gainsboro; font-size: 1.2em;');
			var el2 = document.createElement('a');
			el2.appendChild(document.createTextNode("Please report any errors here."));
			el2.setAttribute('href', 'http://github.com/nzmsv/udacity-dl/issues/');
			el2.setAttribute('target', '_blank');
			version_warning.appendChild(el2);
		}

		if (data.error && data.error.type == 'version') {
			console.log("Version mismatch");
			function wait_content() {
				var content = document.getElementById('content');
				if (content && content.parentNode) {
					document.removeEventListener('DOMNodeInserted', wait_content);
					content.parentNode.insertBefore(version_warning, content);
				}
			};
			document.addEventListener('DOMNodeInserted', wait_content, false);
		}
		else { //API version matched
			function showclass(classname)
			{
				var ids = document.getElementsByClassName(classname);
				for (var i = 0; i < ids.length; i++) {
					ids[i].style.display = '';
				}
			}

			function hideclass(classname)
			{
				var ids = document.getElementsByClassName(classname);
				for (var i = 0; i < ids.length; i++) {
					ids[i].style.display = 'none';
				}
			}

			function getUnitVideos(video_map, layout)
			{
				var directlinks = {};

				function videolist(video_map, layout)
				{
					function updateData(qs)
					{
						function parseQueryString(qs)
						{
							object = {};

							qs.split('&').map(function(part) {
								kv = part.split('=');
								object[decodeURIComponent(kv[0])] =
									decodeURIComponent(kv[1]);
							});

							return object;
						}

						function getSubtitles(url, a)
						{
							{
								var tracks_url = url + "&type=list"
								var xhr = new XMLHttpRequest();
								xhr.onreadystatechange = function(data) {
									if (xhr.readyState == 4 && xhr.status == 200) {
										var tracks = xhr.responseXML;

										var track_name =
											tracks.evaluate("//*/track[@lang_default='true']/@name", tracks).iterateNext();
										if (track_name) {
											track_name = track_name.value;
											a.innerText = track_name + " (SRT)";
											a.setAttribute('href', url
														   + "&type=track&lang=en&fmt=srt&name="
														   + encodeURIComponent(track_name));
										}
									}
								}
								xhr.open('GET', tracks_url, true);
								xhr.send();
							}
						}

						var fmt_map = {};
						var data = parseQueryString(qs);

						var fmt = data['fmt_list'];
						if (fmt) {
							fmt = fmt.split(',').map(function(a) {
								return a.split('/')[0];
							});

							var streams = data['url_encoded_fmt_stream_map'].split(',')
								.map(parseQueryString);

							for (var i = 0; i < fmt.length; i++) {
								fmt_map[fmt[i]] = streams[i]['url'];
							}
						}
						this.videoLinks = fmt_map;

						if (data['ttsurl'])
							getSubtitles(data['ttsurl'], this.subLink);
						else
							this.subLink.removeAttribute('href');
					}

					function pad(n) {
						return ("000" + n).slice(-3);
					}

					function changeFormat(f)
					{
						this.removeAttribute('href');
						this.rawLink.innerText = '';
						this.rawLink.removeAttribute('href');
						if (this.videoLinks) {
							if (this.videoLinks[f]) {
								this.errmsg.setAttribute('style', 'display:none');
								var link = this.videoLinks[f]
									+ '&title='
									+ encodeURIComponent(pad(this.videoNumber)
														 + ' ' + this.innerText);
								this.setAttribute('href', link);
								this.rawLink.innerText = link;
								this.rawLink.setAttribute('href', link);
							}
							else {
								this.errmsg.innerText = "Video not available in selected format";
								this.errmsg.removeAttribute('style');
							}
						}
					}

					var vlist = document.createElement('div');

					for (v in layout) {
						var video = layout[v];

						if (video && video.nugget_key) {
							video = video_map[video.nugget_key];

                            if (video.media && video.media.youtube_id) {
                                // or could check (video.nuggetType == 'lecture')
                                var el = document.createElement('div');
                                vlist.appendChild(el);
                                var li = document.createElement('li');
                                el.appendChild(li);

                                el = document.createElement('div');
                                el.setAttribute('class', 'udacity-dl-direct-link');
                                li.appendChild(el);

                                var throbber = document.createElement('img');
                                throbber.setAttribute('src', chrome.extension.getURL(
                                    "throbber.gif"));
                                el.appendChild(throbber);

                                var el2 = document.createElement('a');
                                el.appendChild(el2);

                                el = document.createElement('div');
								el.setAttribute('class', 'udacity-dl-sub-link');
								li.appendChild(el);

                                var sublink = document.createElement('a');
								sublink.setAttribute('download', pad(videolist.count) + ' ' + video.name + '.srt');
								sublink.setAttribute('style', 'margin-left:2em;-webkit-user-select:text');
                                el.appendChild(sublink);

                                el = document.createElement('div');
                                el.setAttribute('style', 'overflow-x:auto;width:95%');
								el.setAttribute('class', 'udacity-dl-raw-link');
								li.appendChild(el);

								el2.setAttribute('style', '-webkit-user-select:text');
								el2.appendChild(document.createTextNode(video.name));
								el2.videoNumber = videolist.count++;
								el2.updateData = updateData;
								el2.changeFormat = changeFormat;
								el2.rawLink = document.createElement('a');
								el2.subLink = sublink;
								el2.progress = throbber;
								el.appendChild(el2.rawLink);
								el2.rawLink.setAttribute('style', '-webkit-user-select:text;white-space:nowrap;margin:2ex');
								el2.errmsg = document.createElement('div');
								el2.errmsg.setAttribute('class', 'error');
								if (directlinks[video.media.youtube_id]) {
									el2.errmsg.appendChild(document.createTextNode("Duplicate video.  Please check the discussion forum for updates."));
								}
								else {
									el2.errmsg.setAttribute('style','display:none');
									directlinks[video.media.youtube_id] = el2;
								}
								el2.appendChild(el2.errmsg);

								el = document.createElement('div');
								el.setAttribute('class', 'udacity-dl-youtube-id');
								var el2 = document.createElement('a');
								el2.setAttribute('style', 'margin-left:2em;-webkit-user-select:text');
								el2.setAttribute('target', '_blank');
								el2.setAttribute('href', 'http://www.youtube.com/watch?v='
												 + video.media.youtube_id);
								el.appendChild(el2);
								el2.appendChild(document.createTextNode(video.media.youtube_id));
								li.appendChild(el);
							}
						}
						else if (video) {
							vlist.appendChild(videolist(video_map, video));
						}
					}

					return vlist;
				}

				videolist.count = 1;
				unit_videos = videolist(video_map, layout);
				unit_videos.links = directlinks;
				return unit_videos;
			}
			var download = document.createElement('div');

			var closeLink = document.createElement('div');
			closeLink.setAttribute('style', "float:right;cursor:pointer;height:23px;width:23px;padding:0px;background:url('http://www.udacity.com/media/img/close-button-23x23.gif');");
			download.appendChild(closeLink);

			download.appendChild(version_warning);

			var el = document.createElement('form');
			el.setAttribute('style', "margin-top:12pt;float:right;clear:right");
			var el2 = document.createElement('span');
			el2.setAttribute('style', "font-size:8pt");
			el2.appendChild(document.createTextNode("Format"));
			el.appendChild(el2);
			el2 = document.createElement('select');
			el2.setAttribute('size', "1");
			el2.setAttribute('style', "font-size:8pt;padding:1px");
			el.appendChild(el2);
			download.appendChild(el);
			var format_chooser = el2;

			el = document.createElement('option');
			el.setAttribute('value', "37");
			el.appendChild(document.createTextNode("MP4 1080p"));
			el2.appendChild(el);
			el = document.createElement('option');
			el.setAttribute('value', "22");
			el.appendChild(document.createTextNode("MP4 720p"));
			el2.appendChild(el);
			el = document.createElement('option');
			el.setAttribute('value', "18");
			el.appendChild(document.createTextNode("MP4 360p"));
			el2.appendChild(el);
			el = document.createElement('option');
			el.setAttribute('value', "46");
			el.appendChild(document.createTextNode("WebM 1080p"));
			el2.appendChild(el);
			el = document.createElement('option');
			el.setAttribute('value', "45");
			el.appendChild(document.createTextNode("WebM 720p"));
			el2.appendChild(el);
			el = document.createElement('option');
			el.setAttribute('value', "44");
			el.appendChild(document.createTextNode("WebM 480p"));
			el2.appendChild(el);
			el = document.createElement('option');
			el.setAttribute('value', "43");
			el.appendChild(document.createTextNode("WebM 360p"));
			el2.appendChild(el);
			el = document.createElement('option');
			el.setAttribute('value', "5");
			el.appendChild(document.createTextNode("FLV 224p"));
			el2.appendChild(el);
			format_chooser.value = localStorage["udacity-dl-format"];

			el = document.createElement('h1');
			el.appendChild(document.createTextNode(data.payload.course_title));
			download.appendChild(el);

			el = document.createElement('h2');
			el.appendChild(document.createTextNode(data.payload.rev_name));
			download.appendChild(el);

			el = document.createElement('form');
			var unit_chooser = document.createElement('select');
			unit_chooser.units = new Array();
			unit_chooser.setAttribute('size', '1');
			unit_chooser.setAttribute('style', 'font-size:11pt;padding:2px;width:30%');
			el.appendChild(unit_chooser);
			download.appendChild(el);

			var tools = document.createElement('div');
			tools.setAttribute('style', 'float:right;clear:both;background-color:gainsboro;padding:5px 5px 0px 25px;border-top-left-radius:5px;margin-top:-10px');
			download.appendChild(tools);

			el = document.createElement('div');
			el.setAttribute('style', 'display:inline;margin-right:1em');
			el2 = document.createElement('a');
			el2.setAttribute('class', 'arrow');
			el2.setAttribute('style', 'cursor:pointer;color:#176E9B');
			el2.appendChild(document.createTextNode("Direct"));
			el2.visible = true;
			el2.addEventListener('click', function () {
				if (this.visible) {
					hideclass('udacity-dl-direct-link');
					this.visible = false;
					this.setAttribute('class', 'arrow disabled');
				}
				else {
					showclass('udacity-dl-direct-link');
					this.visible = true;
					this.setAttribute('class', 'arrow');
				}
			});
			el.appendChild(el2);
			tools.appendChild(el);

			el = document.createElement('div');
			el.setAttribute('style', 'display:inline;margin-right:1em');
			el.setAttribute('class', '');
			el2 = document.createElement('a');
			el2.setAttribute('class', 'arrow disabled');
			el2.setAttribute('style', 'cursor:pointer;color:#176E9B');
			el2.appendChild(document.createTextNode("YouTube"));
			el2.addEventListener('click', function () {
				if (this.visible) {
					hideclass('udacity-dl-youtube-id');
					this.visible = false;
					this.setAttribute('class', 'arrow disabled');
				}
				else {
					showclass('udacity-dl-youtube-id');
					this.visible = true;
					this.setAttribute('class', 'arrow');
				}
			});
			el.appendChild(el2);
			tools.appendChild(el);

			el = document.createElement('div');
			el.setAttribute('style', 'display:inline;margin-right:1em');
			el.setAttribute('class', '');
			el2 = document.createElement('a');
			el2.setAttribute('class', 'arrow disabled');
			el2.setAttribute('style', 'cursor:pointer;color:#176E9B');
			el2.appendChild(document.createTextNode("Raw"));
			el2.addEventListener('click', function () {
				if (this.visible) {
					hideclass('udacity-dl-raw-link');
					this.visible = false;
					this.setAttribute('class', 'arrow disabled');
				}
				else {
					showclass('udacity-dl-raw-link');
					this.visible = true;
					this.setAttribute('class', 'arrow');
				}
			});
			el.appendChild(el2);
			tools.appendChild(el);

			el = document.createElement('div');
			el.setAttribute('style', 'display:inline;margin-right:1em');
			el.setAttribute('class', '');
			el2 = document.createElement('a');
			el2.setAttribute('class', 'arrow disabled');
			el2.setAttribute('style', 'cursor:pointer;color:#176E9B');
			el2.appendChild(document.createTextNode("Subtitles"));
			el2.addEventListener('click', function () {
				if (this.visible) {
					hideclass('udacity-dl-sub-link');
					this.visible = false;
					this.setAttribute('class', 'arrow disabled');
				}
				else {
					showclass('udacity-dl-sub-link');
					this.visible = true;
					this.setAttribute('class', 'arrow');
				}
			});
			el.appendChild(el2);
			tools.appendChild(el);

			var ulist = document.createElement('ul');
			download.appendChild(ulist);

			var units = data.payload.course_rev.units;
			var unit_map = {};
			for (u in units) {
				unit_map[units[u].key] = units[u];
			}

			var unit_layout = data.payload.course_rev.unitLayout;

			for (u in unit_layout) {
				unit = unit_map[unit_layout[u].unit_key];

				el = document.createElement('li');
				el.setAttribute('class', 'unit-header');
				el.setAttribute('style', 'cursor:default');

				el2 = document.createElement('option');
				el2.setAttribute('value', u);
				el2.appendChild(document.createTextNode(unit.name));
				unit_chooser.units[u] = el;
				unit_chooser.appendChild(el2);

				el2 = document.createElement('div');
				el2.setAttribute('class', 'unit-name');
				el2.appendChild(document.createTextNode(unit.name));
				el.appendChild(el2);

				ulist.appendChild(el);

				var video_map = {};
				for (v in unit.nuggets) {
					var nugget = unit.nuggets[v];
					if (nugget && nugget.key)
						video_map[nugget.key] = nugget;
				}

				el2 = document.createElement('ol');
				el2.setAttribute('class', 'nugget-list');
				el2.setAttribute('style', '-webkit-user-select: none');

				var vlist = getUnitVideos(video_map, unit.nuggetLayout);
				unit_chooser.units[u].links = vlist.links;
				el2.appendChild(vlist);
				el.appendChild(el2);
			}

			unit_chooser.getUnitLinks = function() {
				function getFormats(youtube_id, a)
				{
					a.videoLinks = null;
					a.progress.hidden = false;
					a.changeFormat();
					var xhr = new XMLHttpRequest();
					xhr.onreadystatechange = function(data) {
						if (xhr.readyState == 4 && xhr.status == 200) {
							a.updateData(xhr.responseText);
							a.changeFormat(format_chooser.value);
							a.progress.hidden = true;
						}
					}
					var url = 'http://www.youtube.com/get_video_info?video_id='
						+ youtube_id;
					xhr.open('GET', url, true);
					xhr.send();
				}

				for (var u = 0; u < unit_chooser.units.length; u++) {
					unit_chooser.units[u].style.display =
						(u == unit_chooser.value ? '' : 'none');
				}

				var links = unit_chooser.units[unit_chooser.value].links;
				for (i in links) {
					getFormats(i, links[i]);
				}
			};

			unit_chooser.addEventListener('change', function () {
				unit_chooser.getUnitLinks();
			});

			format_chooser.addEventListener('change', function () {
				localStorage["udacity-dl-format"] = format_chooser.value;
				unit_chooser.getUnitLinks();
			});

			target = document.createElement('div');
			target.setAttribute('style', 'float:right');

			openLink = document.createElement('a');
			openLink.setAttribute('class', 'button');
			openLink.appendChild(document.createTextNode("Download"));

			target.appendChild(openLink);

			download.hidden = true;
			download.setAttribute('class', 'width960');

			openLink.addEventListener('click', function () {
				unit_chooser.getUnitLinks();

				download.hidden = false;
				content.hidden = true;
				openLink.setAttribute('style', 'display:none');
			});

			closeLink.addEventListener('click', function () {
				download.hidden = true;
				content.hidden = false;
				openLink.removeAttribute('style');
			});

			function waitInsertButton() {
				var buttonContainer = document.getElementById('player-right-column');
				var content = document.getElementById('content');
				if (content && content.parentNode &&
						buttonContainer && buttonContainer.querySelector('.units')) {
					document.removeEventListener('DOMNodeInserted', waitInsertButton);
					content.parentNode.insertBefore(download, content);
					content.parentNode.insertBefore(download, content);
					buttonContainer.appendChild(target);
					hideclass('udacity-dl-youtube-id');
					hideclass('udacity-dl-raw-link');
					hideclass('udacity-dl-sub-link');
					if (data.version == udacity_version_verified)
						download.removeChild(version_warning);
				}
			};
			document.addEventListener('DOMNodeInserted', waitInsertButton, false);
			waitInsertButton();
		}
	}

	if (document.querySelectorAll('#content .unit-header')) {
		udacityAjax(JSON.stringify({
			data: {
				path: document.location.hash
			},
			method: 'course.get'
		}), "application/json;charset=utf-8", getUnit);
	}

} (this));
