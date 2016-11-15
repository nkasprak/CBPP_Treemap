/*globals CBPP, Raphael*/
(function() {
	"use strict";
	if (typeof(CBPP.Treemap)!=="undefined") {
		return;
	}
	CBPP.Treemap = {};
	CBPP.Treemap.ready = false;
	var urlBase;

	CBPP.Treemap.load = function(callback) {
		CBPP.Treemap.urlBase = CBPP.urlBase + "CBPP_Treemap/v" + CBPP.Treemap.version + "/";
		urlBase = CBPP.Treemap.urlBase;
		var thisTreemapLoaded = false, colorsLoaded = false, tilingLoaded = false, raphaelLoaded = false;
		$.getScript(urlBase + "treemap.colors.js", function() {
			colorsLoaded = true;
			ready();
		});
		$.getScript(urlBase + "treemap.tiling.js", function() {
			tilingLoaded = true;
			ready();	
		});
		if (typeof(Raphael)==="undefined") {
			$.getScript(urlBase + "raphael.min.js", function() {
				raphaelLoaded = true;
				ready();
			});
		} else {
			raphaelLoaded = true;
		}
		function ready() {
			if (tilingLoaded && colorsLoaded && raphaelLoaded) {
				thisTreemapLoaded = true;
				CBPP.Treemap.ready = true;
				callback();
			}
		}
	};

	CBPP.Treemap.Treemap = function() {
		var t = this;
		t.colorUtils = CBPP.Treemap.colorUtils;
		t.returnCoords = CBPP.Treemap.returnCoords;
		
		t.determineNodeFromCoords = function(coords,level) {
			var currentLevelBoxList = [];
			for (var i = 0;i<t.activeBoxList.length;i++) {
				if (t.activeBoxList[i].level === level) {
					currentLevelBoxList.push(t.activeBoxList[i]);	
				}
			}
			function containsCoords(range,coord) {
				var contains = false;
				if (coord[0] >= range[0][0] && coord[0] <= range[1][0] && coord[1] >= range[0][1] && coord[1] <= range[1][1]) {
					contains = true;	
				}
				return contains;
			}
			for (i=0;i<currentLevelBoxList.length;i++) {
				if (containsCoords(currentLevelBoxList[i].coords,coords)) {
					return currentLevelBoxList[i].id;
				}
			}
			return null;
		};
		t.createRaphaelCanvas = function(selector) {
			var $canvas = $(selector);
			$canvas.css("cursor","pointer");
			t.paper = Raphael($canvas[0],$canvas.width(),$canvas.height());
			t.selector = selector;
			$canvas.off("mouseleave");
			$canvas.on("mouseleave",t.deleteOverlays);
			return t.paper;
		};
		t.resetTextColors = function() {
			$.each(t.textByID,function(id,textObj) {
				textObj.attr({"fill":"#fff","opacity":1});
			});
		};
		t.drawOverlayRect = function(rectID,mode) {
			var x,y,height,width;
			x = t.rectByID[rectID].attrs.x;
			y = t.rectByID[rectID].attrs.y;
			height = Math.max(t.rectByID[rectID].attrs.height,0);
			width = Math.max(t.rectByID[rectID].attrs.width,0);
			if (mode==="primary") {
				t.overlayRect = t.paper.rect(x+1,y+1,Math.max(width-2,0),Math.max(height-2,0));
				t.overlayRect.attr({"stroke":"#ff0","stroke-width":2,"stroke-opacity":0.5,"fill-opacity":0});
			} else if (mode==="secondary") {
				t.secondaryOverlayRect =  t.paper.rect(x+2,y+2,Math.max(width-4,0),Math.max(height-4,0));
				t.secondaryOverlayRect.attr({"stroke":"#f00","stroke-width":4,"stroke-opacity":0.5});
			}
			return {x:x,y:y,height:height,width:width};
		};
		t.drawSecondaryOverlayText = function(pageX, pageY,id,createNew) {
			if (typeof(createNew)==="undefined") {createNew = true;}
			var x,y,width,height,dims,textBBox,textBBoxWidth, textBBoxHeight,nodeValue,mouseX,mouseY;
			var name = t.nameByID[id];
			function positionOverlayRect(mCoord,size,rectC,minSep) {
				var baseCoord = (mCoord + rectC + size/2)/2;
				var sep = baseCoord - mCoord;
				if (sep < 0) {
					if (sep > 0-minSep) {
						baseCoord -= (minSep + sep);	
					} 
				} else {
					if (sep < minSep) {
						baseCoord += (minSep - sep);
					}
				}
				return baseCoord;
			}
			
			dims = t.drawOverlayRect(id,"secondary");
			x=dims.x;y=dims.y;height=dims.height;width=dims.width;
			if (typeof(t.secondaryHoverText)==="undefined" || createNew) {
				t.secondaryHoverText = t.paper.text(0,0,"");
			}
			nodeValue = t.dataByID[id];
			t.secondaryHoverText.attr({"text":t.tipFormatter(id,name,nodeValue),"font-size":14,"text-anchor":"start"});
			textBBox = t.secondaryHoverText.getBBox();
			textBBoxWidth = textBBox.width + 5;
			textBBoxHeight = textBBox.height + 5;
			if (t.rectByID[t.rectParents[id]].attr("width") > t.rectByID[t.rectParents[id]].attr("height")) {
				if ((t.rectByID[id].attr("y")+t.rectByID[id].attr("height")/2)/$(t.selector).height() < 0.5) {
					mouseY = pageY - $(t.selector).offset().top + textBBoxHeight/2 + 10;
				} else {
					mouseY = pageY - $(t.selector).offset().top - textBBoxHeight/2 - 10;
				}
				mouseX = positionOverlayRect(pageX - $(t.selector).offset().left,t.rectByID[id].attr("width"),t.rectByID[id].attr("x"),0);
			} else {
				if ((t.rectByID[id].attr("x")+t.rectByID[id].attr("width")/2)/$(t.selector).width() < 0.5) {
					mouseX = pageX - $(t.selector).offset().left + textBBoxWidth/2 + 10;
				} else {
					mouseX = pageX - $(t.selector).offset().left - textBBoxWidth/2 - 10;
				}
				mouseY = positionOverlayRect(pageY - $(t.selector).offset().top,t.rectByID[id].attr("height"),t.rectByID[id].attr("y"),0);
			}
			mouseX = Math.min(mouseX, $(t.selector).width() - textBBoxWidth/2);
			mouseX = Math.max(mouseX,textBBoxWidth/2);
			mouseY = Math.min(mouseY, $(t.selector).height() - textBBoxHeight/2);
			mouseY = Math.max(mouseY,textBBoxWidth/2);
			t.secondaryHoverText.attr({x:mouseX-textBBoxWidth/2+2,y:mouseY,fill:"#fff"});
			if (typeof(t.secondaryTextRect)==="undefined" || createNew) {
				t.secondaryTextRect = t.paper.rect(0,0,0,0);
			}
			t.secondaryTextRect.attr({x:mouseX-textBBoxWidth/2,y:mouseY-textBBoxHeight/2,width:textBBoxWidth,height:textBBoxHeight});
			t.secondaryTextRect.attr({fill:"#b9292f","stroke-width":0});
		};
		t.rectHover = function(node,e,createNew) {
			if (typeof(createNew)==="undefined") {createNew = true;}
			var dims,name,x,y,height,width;
			var level = t.levelByID[t.idByRaphaelID[node.raphaelid]];
			
			if (t.overlayRect) {t.overlayRect.remove();}
			if (t.secondaryOverlayRect) {t.secondaryOverlayRect.remove();}
			delete t.overlayRect;
			delete t.secondaryOverlayRect;
			if (createNew) {
				if (t.secondaryHoverText) {t.secondaryHoverText.remove();}
				if (t.secondaryTextRect) {t.secondaryTextRect.remove();}
				delete t.secondaryHoverText;
				delete t.secondaryTextRect;
			}
			var id = t.idByRaphaelID[node.raphaelid];
			if (level < t.hoverState) {
				t.hoverState = level;
			}

			var mouseOverHandler = function(e) {
				t.rectHover(node,e,false);
				e.cancelBubble = true;
				e.stopPropagation();
			};

			var mouseClickHandler = function(e) {
				t.rectClick(node,e,false);
				e.cancelBubble = true;
				e.stopPropagation();
			};
		
			while (level > t.hoverState) {
				if (level === t.hoverState+1) {
					t.drawSecondaryOverlayText(e.pageX,e.pageY,id,createNew);
					if (createNew) {
						$(t.secondaryHoverText.node, t.secondaryTextRect.node).off("mouseover");
						$(t.secondaryHoverText.node, t.secondaryTextRect.node).on("mouseover",mouseOverHandler);
						$(t.secondaryHoverText.node, t.secondaryTextRect.node).on("click",mouseClickHandler);
					}
				}
				level = t.levelByID[t.rectParents[id]];
				id = t.idByRaphaelID[t.rectByID[t.rectParents[id]].id];
			}
			
			dims = t.drawOverlayRect(id,"primary");
			x=dims.x;y=dims.y;height=dims.height;width=dims.width;
			t.resetTextColors();
			if (t.textByID[id]) {
				t.textByID[id].attr({"fill":"#ff0","opacity":0.5});
			}
			name =  t.nameByID[id];
			function makeYellowHoverText() {
				var leftPos = x+width/2;
				var rightPos = y+height/2;
				t.hoverText = t.paper.text(0,0,name);
				t.hoverText.attr({"font-size":14,"fill":"#ff0","opacity":0.5});
				var textBBox = t.hoverText.getBBox();
				var textBBoxWidth = textBBox.width + 5;
				leftPos = Math.min(leftPos, $(t.selector).width() - textBBoxWidth/2);
				leftPos = Math.max(leftPos, textBBoxWidth/2);
				t.hoverText.attr({x:leftPos,y:rightPos});
				$(t.hoverText.node).on("mousemove", function(e) {
					t.generalizedHover(e,level);	
				});
				$(t.hoverText.node).on("click",function(e) {
					t.generalizedClick(e,level);
				});
				t.hoverText.toFront();
				
			}
			if (t.hoverText) {
				if (t.hoverText.attr("text") !== name) {
					t.hoverText.remove();
					if (t.hoverState > 0) {
						makeYellowHoverText();
					}
				}
			} else {
				if (t.hoverState > 0) {
					makeYellowHoverText();
				}
			}
			if (createNew) {
				if (t.secondaryTextRect) {t.secondaryTextRect.toFront();}
				if (t.secondaryHoverText) {t.secondaryHoverText.toFront();}
			}
		};
		t.generalizedEvent = function(e,level,type) {
			var action;
			if (type==="click") {action = t.rectClick;}
			else if (type==="hover") {action = t.rectHover;} 
			else {return false;}
			var left = e.pageX - $(t.selector).offset().left;
			var top = e.pageY - $(t.selector).offset().top;
			var id = t.determineNodeFromCoords([left,top],level+1);
			if (id) {action(t.rectByID[id].node,e);}
			else {id = t.determineNodeFromCoords([left,top],level);}
			if (id) {action(t.rectByID[id].node,e);}
		};
		t.generalizedHover = function(e,level) {
			t.generalizedEvent(e,level,"hover");
		};
		t.generalizedClick = function(e,level) {
			t.generalizedEvent(e,level,"click");
		};
		t.rectClick = function(node,e) {
			t.hoverState = (t.hoverState+1)%(t.maxLevel+1);
			
			t.rectHover(node,e,false);
		};
		t.deleteOverlays = function() {
			if (t.overlayRect) {t.overlayRect.remove();}
			if (t.secondaryOverlayRect) {t.secondaryOverlayRect.remove();}
			if (t.secondaryHoverText) {t.secondaryHoverText.remove();}
			if (t.secondaryTextRect) {t.secondaryTextRect.remove();}
			if (t.hoverText) {t.hoverText.remove();}
			t.hoverState = -1;
			t.resetTextColors();
		};
		t.drawTreeData = function(boxList, colorConfig, duration, tipFormatter, maintainOrder) {
			if (typeof(t.activeBoxList) === "undefined") {t.activeBoxList = [];}
			if (typeof(maintainOrder)==="undefined") {maintainOrder = false;}
			var boxOrder = {}, i;
			if (t.activeBoxList.length === boxList.length && maintainOrder) {
				for (i=0;i<t.activeBoxList.length;i++) {
					boxOrder[t.activeBoxList[i].id] = i;
				}
				boxList.sort(function(a,b) {
					return boxOrder[a.id] - boxOrder[b.id];
				});
			}
			t.activeBoxList = boxList;
			if (typeof(colorConfig.initialColor)==="undefined") {
				colorConfig.initialColor = "#aa0000";
			}
			if (typeof(colorConfig.tintColor)==="undefined") {
				colorConfig.tintColor = "#ff0000";
			}
			console.log(colorConfig);
			var currentColor = colorConfig.initialColor,
			opacity=1,
			tintColor = colorConfig.tintColor,
			hsvInitialColor = t.colorUtils.RGBToHSV(t.colorUtils.HexToRGB(colorConfig.initialColor)),
			saturation = hsvInitialColor[1],
			brightness = hsvInitialColor[2],
			paper = t.paper;
			if (typeof(tipFormatter)==="undefined") {
				tipFormatter = function(id, name) {
					return name;
				};
			}
			t.tipFormatter = tipFormatter;
			if (typeof(t.rectByID)==="undefined") {t.rectByID = {};}
			if (typeof(t.textByID)==="undefined") {t.textByID = {};}
			delete(t.baseAnimation);
			delete(t.baseAnimationEl);
			t.rectParents = {};
			t.idByRaphaelID = {};
			t.totalByID = {};
			t.nameByID = {};
			t.dataByID = {};
			t.levelByID = {};
			t.hoverState = -1;
			t.maxLevel = 0;
			
			//delete unused rectangles
			$.each(t.rectByID,function(id) {
				var removeBox = true;
				$.each(boxList,function(i,box) {
					if (box.id === id) {removeBox = false;}
				});
				if (removeBox) {
					if (typeof(t.rectByID[id]) !== "undefined") {
						t.rectByID[id].remove();
						delete(t.rectByID[id]);
					}
					if (typeof(t.textByID[id]) !== "undefined") {
						t.textByID[id].remove();
						delete(t.textByID[id]);
					}
				}
			});
			
			t.deleteOverlays();
			
			var seededRandomNumber = (function() {
				var seed = 1;
				return function() {
					var x = Math.sin(seed++)*10000;
					return x - Math.floor(x);
				};
			})();

			$.each(boxList,function(i,rect) {
				var box = rect.coords,
				level = rect.level,
				x = box[0][0],
				y = box[0][1],
				width = box[1][0] - box[0][0],
				height = box[1][1] - box[0][1], 
				hsvColor,$node;
				if (level > t.maxLevel) {t.maxLevel = level;}
				t.levelByID[rect.id] = level;
				t.dataByID[rect.id] = rect.value;
				t.nameByID[rect.id] = rect.name;
				if (typeof(t.rectByID[rect.id]) === "undefined") {
					t.rectByID[rect.id] = paper.rect(x,y,Math.max(width,0),Math.max(height,0));
				} else {
					if (typeof(t.baseAnimation === "undefined")) {
						t.baseAnimation = Raphael.animation({x:x,y:y,width:Math.max(width,0),height:Math.max(height,0)},duration);
						t.baseAnimationEl = t.rectByID[rect.id];
						t.rectByID[rect.id].animate(t.baseAnimation);
					} else {
						t.rectByID[rect.id].animateWith(
							t.baseAnimationEl,
							t.baseAnimation,
							{x:x,y:y,width:width,height:height}
						);
					}
				}
				t.rectByID[rect.id].attr("stroke-width",0);
				t.rectParents[rect.id] = rect.parent;
				t.idByRaphaelID[t.rectByID[rect.id].id] = rect.id;
				$node = $(t.rectByID[rect.id].node);
				$node.off("mousemove touchstart click");
				$node.on("mousemove touchstart", function(e) {
					t.rectHover(this,e);	
					e.cancelBubble = true;
					e.stopPropagation();
				});
				$node.on("click", function(e) {
					t.rectClick(this,e);
					e.cancelBubble = true;
					e.stopPropagation();
				});
				t.rectByID[rect.id].attr("stroke","#fff");
				t.rectByID[rect.id].attr("stroke-opacity",0.2);
				t.rectByID[rect.id].attr("stroke-width",1);
				
				switch (level) {
					case 0 :
					t.rectByID[rect.id].attr("fill",currentColor);
					hsvColor = t.colorUtils.RGBToHSV(t.colorUtils.HexToRGB(currentColor));
					hsvColor[0] = (hsvColor[0]+ 360 + 40)%360;
					currentColor = t.colorUtils.RGBToHex(t.colorUtils.HSVToRGB(hsvColor));
					//console.log(currentColor);
					if (typeof(t.textByID[rect.id]) === "undefined") {
						t.textByID[rect.id] = paper.text(x+5,y+15,rect.name);
						t.textByID[rect.id].attr({"font-size":16,"text-anchor":"start","fill":"#fff"});
					} else {
						if (typeof(t.baseAnimation === "undefined")) {
							t.baseAnimation = Raphael.animation({x:x+5,y:y+15},duration);
							t.baseAnimationEl = t.textByID[rect.id];
							t.textByID[rect.id].animate(t.baseAnimation);
						} else {
							t.textByID[rect.id].animateWith(
								t.baseAnimationEl,
								t.baseAnimation,
								{x:x+5,y:y+15}
							);
						}
					}
					break;
					case 1:
					t.rectByID[rect.id].attr("fill","#000");
					t.rectByID[rect.id].attr("fill-opacity",opacity/10);
					opacity = (opacity+1)%3;
					break;
					case 2:
					hsvColor = [];
					hsvColor[0] = (seededRandomNumber()*360 + 360)%360;
					hsvColor[1] = saturation;
					hsvColor[2] = brightness + (100-brightness)*seededRandomNumber();
					console.log(hsvColor);
					hsvColor = t.colorUtils.RGBToHex(t.colorUtils.HSVToRGB(hsvColor));
					//console.log(hsvColor);
					t.rectByID[rect.id].attr("fill",hsvColor);
					t.rectByID[rect.id].attr("fill-opacity",0.2);
					break;
					default:
					t.rectByID[rect.id].attr("stroke-width",1.5/(level-2));
					t.rectByID[rect.id].attr("stroke","#ddd");
					t.rectByID[rect.id].attr("stroke-opacity",0.5/(level-2));
					t.rectByID[rect.id].attr("fill","#fff");
					t.rectByID[rect.id].attr("fill-opacity",1/(5*level));
					break;
				}
			});
			var mouseMoveHandler = function(e) {
				t.generalizedHover(e,t.hoverState);	
			};
			var textClickHandler = function(e) {
				t.generalizedClick(e,t.hoverState);	
			};
			for (var id in t.textByID) {
				if (t.textByID.hasOwnProperty(id)) {
					t.textByID[id].toFront();
					$(t.textByID[id].node).on("mousemove",mouseMoveHandler);	
					$(t.textByID[id].node).on("click", textClickHandler);	
				}
			}
		};
	};
})();

