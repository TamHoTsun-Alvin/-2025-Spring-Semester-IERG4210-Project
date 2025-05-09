<?php
$directory = "/var/www/html/res/pics/";
$targetFile = $directory . basename($_FILES["image"]["name"]);

$mimeType = mime_content_type($_FILES["image"]["tmp_name"]);
if ($mimeType !== 'image/jpeg') {
    die("Only JPG files are allowed.");
}


if (move_uploaded_file($_FILES["image"]["tmp_name"], $targetFile)) {
    echo "File uploaded successfully!";
} else {
    echo "Upload failed.";
}
?>