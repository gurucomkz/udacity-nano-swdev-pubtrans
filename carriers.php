#!/usr/bin/php
<?
$carriers = json_decode(file_get_contents('server/carriers.json'), true);
$targetDir = 'server/gtfs';
$archiveDir = 'server/archives';
@mkdir($archiveDir);
@mkdir($targetDir);

foreach($carriers as $carrier){
	$ctID = $carrier['CarrierID'];
	$zipName = "$archiveDir/$ctID.zip";
	echo $ctID."...";
	if(!file_exists($zipName)){
		$zip = file_get_contents("http://api.511.org/transit/datafeeds?api_key=4bad51fb-4b43-4464-9f5e-e69576651176&operator_id=$ctID");
		file_put_contents($zipName, $zip);
	}else{
		echo "exists";
	}
	system("unzip $zipName -d $targetDir/$ctID");
	unlink("$targetDir/$ctID/agency.txt");
	unlink("$targetDir/$ctID/shapes.txt");
	echo "\n";
}
