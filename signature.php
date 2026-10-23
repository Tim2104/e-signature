<?php

$fio     = trim($_POST['fio'] ? filter_var($_POST['fio'], FILTER_SANITIZE_STRING) : "");
$phone   = trim($_POST['phone'] ? filter_var($_POST['phone'], FILTER_SANITIZE_STRING) : "");
$email   = trim($_POST['email'] ? filter_var($_POST['email'], FILTER_SANITIZE_STRING) : "");
$dataUrl = ($_POST['signature'] ?? '');
$arrayData = [];
$dir = __DIR__ . DIRECTORY_SEPARATOR . "signatures";


if ($fio === "" || $phone === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) exit("Проверьте заполнение полей формы");

if (!preg_match('/^data:image\/png;base64,([A-Za-z0-9+\/=]+)$/i', $dataUrl, $arrayData)) exit("Не корректное изображение");

$binData = base64_decode($arrayData[1], true);

if (!is_dir($dir) && !mkdir($dir, 0755, true)) exit("Не удалось создать папку для сохранения");

if(!file_put_contents($dir .DIRECTORY_SEPARATOR. time() . ".png", $binData)) exit("Не удалось сохранить изображение подписи");

echo "Данные отправлены!";

// Следует сохранить $fio, $phone, $email в БД.

?>