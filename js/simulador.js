var simulador = (function () {

	"use strict";

	var canvasFinal, contextFinal,
	canvasMascara, contextMascara,
	canvasSvg, contextSvg,
	canvas, context,
	width = 685,
	height = 490,
	imagemOriginal = document.getElementById("imagemOriginal"),
	corRgb = 'rgb(180, 214, 227)',
	corSelecionada = 'transparent',
	polygonsArea = new Kinetic.Layer(),
	tela = new Kinetic.Stage({ container: 'tela-kinect', width: width,height: height })

	,consoleLog = function( txt ){
		console.log( txt );
	}

	,loading = function( close ){
		close = close ? close : false;
		var el = document.getElementById("loading");
		if( close ) el.style.display = 'none'; else el.style.display = 'block';
	}

	,calculaPolygons = function(){
		var poly = document.querySelectorAll('#telaAreaCor polygon');

		if (poly && poly.length){

			for (var ex = 0; ex < poly.length; ex++){

				var p = poly[ex];

				var polPoints = String( p.attributes['points'].value ).split(',');


				var polygon;
				if( typeof p.attributes['data-excludent'] != 'undefined' && p.attributes['data-excludent'].value == '1'){
					polygon = new Kinetic.Polygon({
						name: 'selecao',
						points: polPoints,
						fill: 'rgb(0,0,0)',
						strokeWidth: 0
					});

					polygon.infoCor = 'nao-cor';
				}else{
					polygon = new Kinetic.Polygon({
						name: 'selecao',
						points: polPoints,
						strokeWidth: 0
					});

				}

				polygonsArea.add( polygon );
			}
		}
	}

	,calculaAreaPolygon = function (polygon){
		var rect = [999999, 999999, 0, 0];

		if (polygon){
			var points = [];

			if (polygon.getPoints){
				points = polygon.getPoints();
			}else
			{
				var tmpPoints = String(polygon.getAttribute('points')).split(',');

				for (var p = 0; p < tmpPoints.length; p += 2){
					points.push({
						x : tmpPoints[p + 0],
						y : tmpPoints[p + 1]
					});
				}
			}

			if (points.length > 0){
				for (var i = 0; i < points.length; i++)
				{
					var x = points[i].x;
					var y = points[i].y;

					rect[0] = Math.min(rect[0], x);
					rect[1] = Math.min(rect[1], y);
					rect[2] = Math.max(rect[2], x);
					rect[3] = Math.max(rect[3], y);
				}

				rect[2] -= rect[0];
				rect[3] -= rect[1];
			}
		}

		return rect;
	}

	,desenha = function (){

		var invalidArea   = [0, 0, canvas.width, canvas.height];
		var imagemObj     = context.getImageData(invalidArea[0], invalidArea[1], invalidArea[2], invalidArea[3]);
		var imagemData    = imagemObj.data;

		var mascaraData   = contextMascara.getImageData(invalidArea[0], invalidArea[1], invalidArea[2], invalidArea[3]).data;

		for (var o = 0; o < mascaraData.length; o += 4)
		{
			var imgRGB = {
				r: imagemData[o],
				g: imagemData[o + 1],
				b: imagemData[o + 2],
				a: imagemData[o + 3]
			};

			var maskRGB = {
				r: mascaraData[o],
				g: mascaraData[o + 1],
				b: mascaraData[o + 2],
				a: mascaraData[o + 3]
			};

			var maskHSL = COLOR_SPACE.rgb2hsl(maskRGB.r, maskRGB.g, maskRGB.b);
			var imgHSL  = COLOR_SPACE.rgb2hsl(imgRGB.r, imgRGB.g, imgRGB.b);

			var alphaMask = maskRGB.a / 255;

			var lumenImg  = imgHSL.l / 255;

			var minGamut = maskHSL.l - Math.min((maskHSL.l * .4), 40);
			var maxGamut = maskHSL.l + (255 - maskHSL.l) * .2;

			var correctGamut = minGamut + (maxGamut - minGamut) * lumenImg;
			var noiseGamut = 255 * .01;
			correctGamut += noiseGamut * Math.cos(Math.random() * Math.PI);
			correctGamut = correctGamut > 255 ? 255 : correctGamut < 0 ? 0 : correctGamut;

			var newRGB = COLOR_SPACE.hsl2rgb(maskHSL.h, maskHSL.s, Math.round(correctGamut));

			imagemObj.data[o + 0] = Math.round((1 - alphaMask) * imgRGB.r + alphaMask * newRGB.r); // R
			imagemObj.data[o + 1] = Math.round((1 - alphaMask) * imgRGB.g + alphaMask * newRGB.g); // G
			imagemObj.data[o + 2] = Math.round((1 - alphaMask) * imgRGB.b + alphaMask * newRGB.b); // B
		}


		contextFinal.putImageData(imagemObj, invalidArea[0], invalidArea[1]);
		limparPolygons();
		loading( true );
	}

	,desenhaMascara = function (){
		var polygons = tela.get('.selecao');

		for (var i = 0; i < polygons.length; i++){

			var polygon = polygons[i];

			var area = calculaAreaPolygon(polygon);

			var contextPolygon = polygon.getLayer().getContext();

			var polygonData = contextPolygon.getImageData( area[0], area[1], area[2], area[3] );

			var svgData = contextSvg.getImageData(area[0], area[1], area[2], area[3] );

			var tmpData  = contextPolygon.createImageData( polygonData );


			for (var d = 0; d < polygonData.data.length; d += 4){

				var polygonRGB = { r: polygonData.data[d + 0],g: polygonData.data[d + 1],b: polygonData.data[d + 2],a: polygonData.data[d + 3] };
				var svgRGB = { r: svgData.data[d + 0], g: svgData.data[d + 1],b: svgData.data[d + 2],a: svgData.data[d + 3] };

				tmpData.data[d + 0] = svgRGB.r;
				tmpData.data[d + 1] = svgRGB.g;
				tmpData.data[d + 2] = svgRGB.b;

				if( svgRGB.r == 255 && svgRGB.b == 255 && svgRGB.g == 255 && /^nao-cor$/i.test(polygon.infoCor) ){
					tmpData.data[d + 3] = 0;
				}else{
					tmpData.data[d + 3] = svgRGB.a;
				}


			}

			contextMascara.putImageData(tmpData, area[0], area[1]);
			polygon.destroy();
		}

		desenha();

	}

	,desenhaSvg = function(){

		loading();
		var polygons =  document.querySelectorAll("#telaAreaCor polygon");
		for (var i = 0; i < polygons.length; i++) {
			if(typeof polygons[i].attributes['data-excludent'] != 'undefined' && polygons[i].attributes['data-excludent'].value == 1 ){
				polygons[i].attributes['style'].value = 'fill: rgb(255,255,255);';
			}

		}

		var telaAreaCor = document.getElementById("telaAreaCor");
		var telaAreaCorXML = (new XMLSerializer).serializeToString( telaAreaCor );
		var telaAreaCorImg  = new Image;
		telaAreaCorImg.src = 'data:image/svg+xml,' + encodeURIComponent( telaAreaCorXML );



		telaAreaCorImg.onload = function(){
			contextSvg.drawImage( telaAreaCorImg, 0, 0, telaAreaCorImg.width, telaAreaCorImg.height );
			calculaPolygons();
			desenhaMascara();
		};
	}

	,limparPolygons = function(){
		var polygons =  document.querySelectorAll("#telaAreaCor polygon");
		for (var i = 0; i < polygons.length; i++) {
			polygons[i].attributes['style'].value = 'fill: transparent;';
		}
	}

	,events = function(){


		var cores =  document.querySelectorAll("#cores ul li")
		for (var i = 0; i < cores.length; i++) {
			cores[i].addEventListener("click", function(){
				corSelecionada = this.attributes['data-cor'].value;
			});
		}


		var polygons =  document.querySelectorAll("#telaAreaCor polygon");
		for (var i = 0; i < polygons.length; i++) {

			polygons[i].addEventListener("click", function(){

				if(  this.attributes['data-excludent'].value != 1 ){
					if(typeof this.attributes['data-titulo'] != 'undefined' ){
						this.attributes['data-titulo'].value = "";
					}

					if(typeof this.attributes['data-codigo'] != 'undefined' ){
						this.attributes['data-codigo'].value = "";
					}

					if(typeof this.attributes['data-cor'] != 'undefined' ){
						this.attributes['data-cor'].value = "";
					}

					if(typeof this.attributes['style'] != 'undefined' ){
						this.attributes['style'].value = 'fill: '+corSelecionada;
						desenhaSvg();
					}
				}
			});



		}

	}

	,init = function () {


		canvas = document.getElementById('canvas-imagem');
		context = canvas.getContext('2d');
		context.drawImage(imagemOriginal, 0, 0, width, height);

		canvasMascara = document.getElementById('canvas-mascara');
		contextMascara = canvasMascara.getContext('2d');

		canvasSvg = document.getElementById('canvas-svg');
		contextSvg = canvasSvg.getContext('2d');

		canvasFinal = document.getElementById('canvas-final');
		contextFinal = canvasFinal.getContext('2d');

		tela.add( polygonsArea );

		events();
		desenhaSvg();

	};

	return {
		init: init
	};
}());
