//Script Landsat 8 RGB Mosaic - 15 meters

var table = ee.FeatureCollection(
    "users/rondonia/abimaelribeiro/limites_rondonia_buffer_10km"
);

var imageVisParam15m = {
    gamma: [1.3, 0.75, 4.0],
    max: 0.125,
    min: 0.004508288741111755,
    opacity: 1,
};


// Busca a coleção de imagens
var landsat8 = ee
    .ImageCollection("LANDSAT/LC08/C02/T1_TOA") 
    .filterBounds(table)
    .filterDate("2022-07-01", "2022-07-31")
    .select(["B8", "B6", "B5", "B4"])
    .filterMetadata("CLOUD_COVER", "less_than", 35);


// Manipulação da imagem 
var image = ee.Image(landsat8.median()); // Calcula a mediana da coleção

var hsv = image.select(["B6", "B5", "B4"]).rgbToHsv(); // Converte valores RGB para HSV

var sharpened = ee.Image.cat([ // Realiza a fusão da banda 8 (pancromática) para obtenção de uma imagem de 15 metros de resolução
    hsv.select("hue"),
    hsv.select("saturation"),
    image.select("B8"),
]).hsvToRgb();


// Retorna os resultados do processamento de imagem
var mosaicPansharpened = sharpened.clip(table); // Recorta a imagem fusionada

Map.centerObject(table, 7); // Centralizar a visualização na área de interesse

Map.addLayer(mosaicPansharpened, imageVisParam15m, "Mosaico Landsat8 15m"); // Retorna a imagem na tela


// Retorna informações da coleção e imagem
var count = landsat8.size();
print("Número de Imagens:", count);
var bandNames = image.bandNames();
print("bands", bandNames);

var range = landsat8.reduceColumns(ee.Reducer.minMax(), ["system:time_start"]); // Obtem os valores mínimos e máximos da coluna time_start
print(
    "Intervalo de datas: ",
    ee.Date(range.get("min")),
    ee.Date(range.get("max"))
);


//Exporta a imagem
Export.image.toDrive({
    image: mosaicPansharpened,
    folder: "EarthEngine/Raster_GEE",
    description: "L8_07_2013_15m",
    region: table,
    scale: 15,
    crs: "EPSG:4674",
    maxPixels: 1e13,
});
