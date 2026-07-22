<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(0);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function jsonResponse(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function cleanText($value, int $maxLength): string
{
    $text = trim(strip_tags((string) $value));
    $text = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $text) ?? '';
    $text = preg_replace('/\s+/u', ' ', $text) ?? '';

    if (function_exists('mb_substr')) {
        return mb_substr($text, 0, $maxLength, 'UTF-8');
    }

    return substr($text, 0, $maxLength);
}

function normalizeHost(string $host): string
{
    $parsedHost = parse_url('https://' . $host, PHP_URL_HOST);
    return strtolower((string) ($parsedHost ?: $host));
}

function sourceHeaderIsTrusted(string $url, string $expectedHost): bool
{
    $sourceHost = parse_url($url, PHP_URL_HOST);
    return $sourceHost !== null && strtolower($sourceHost) === $expectedHost;
}

function requestSourceIsTrusted(): bool
{
    $expectedHost = normalizeHost($_SERVER['HTTP_HOST'] ?? '');
    if ($expectedHost === '') {
        return false;
    }

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $checked = false;

    foreach ([$origin, $referer] as $source) {
        if ($source === '') {
            continue;
        }

        $checked = true;
        if (!sourceHeaderIsTrusted($source, $expectedHost)) {
            return false;
        }
    }

    return $checked;
}

function phoneIsValid(string $phone): bool
{
    $normalized = preg_replace('/[^\d+]/', '', $phone) ?? '';
    return preg_match('/^(?:(?:\+|00)33[1-9]\d{8}|0[1-9]\d{8})$/', $normalized) === 1;
}

function clientIp(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function rateLimitAllows(string $ip): bool
{
    $directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'llcarrelage-step1';
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        return false;
    }

    $file = $directory . DIRECTORY_SEPARATOR . hash('sha256', $ip) . '.txt';
    $now = time();
    $lastSentAt = is_file($file) ? (int) file_get_contents($file) : 0;

    if ($lastSentAt > 0 && ($now - $lastSentAt) < 600) {
        return false;
    }

    file_put_contents($file, (string) $now, LOCK_EX);
    return true;
}

function loadMailer(): void
{
    $autoloadPaths = [
        __DIR__ . '/../vendor/autoload.php',
        __DIR__ . '/vendor/autoload.php',
    ];

    foreach ($autoloadPaths as $autoloadPath) {
        if (is_file($autoloadPath)) {
            require_once $autoloadPath;
            return;
        }
    }

    $sourceDirectories = [
        __DIR__ . '/../PHPMailer/src',
        __DIR__ . '/PHPMailer/src',
    ];

    foreach ($sourceDirectories as $sourceDirectory) {
        if (is_file($sourceDirectory . '/PHPMailer.php')) {
            require_once $sourceDirectory . '/Exception.php';
            require_once $sourceDirectory . '/PHPMailer.php';
            require_once $sourceDirectory . '/SMTP.php';
            return;
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(405, ['success' => false]);
}

if (!requestSourceIsTrusted()) {
    jsonResponse(403, ['success' => false]);
}

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    jsonResponse(500, ['success' => false]);
}

require_once $configPath;
loadMailer();

if (!class_exists(PHPMailer::class)) {
    jsonResponse(500, ['success' => false]);
}

$rawBody = file_get_contents('php://input');
$payload = json_decode((string) $rawBody, true);
if (!is_array($payload)) {
    jsonResponse(400, ['success' => false]);
}

if (cleanText($payload['website'] ?? '', 120) !== '') {
    jsonResponse(200, ['success' => true]);
}

$project = cleanText($payload['project'] ?? '', 120);
$surface = (float) ($payload['surface'] ?? 0);
$city = cleanText($payload['city'] ?? '', 80);
$phone = cleanText($payload['phone'] ?? '', 25);
$browser = cleanText($payload['userAgent'] ?? ($_SERVER['HTTP_USER_AGENT'] ?? ''), 250);
$ip = clientIp();

if ($project === '' || $surface <= 0 || $surface > 10000 || $city === '' || !phoneIsValid($phone)) {
    jsonResponse(400, ['success' => false]);
}

if (!rateLimitAllows($ip)) {
    jsonResponse(429, ['success' => false]);
}

$date = (new DateTimeImmutable('now', new DateTimeZone('Europe/Paris')))->format('d/m/Y H:i:s');
$status = 'Le client a terminé uniquement l\'étape 1 du simulateur.';
$subject = 'Nouveau prospect - Étape 1 du simulateur';
$safePhoneHref = preg_replace('/[^\d+]/', '', $phone) ?: $phone;

$plainBody = implode("\n", [
    '----------------------------------------',
    'Nouveau prospect',
    '',
    'Date : ' . $date,
    'Téléphone : ' . $phone,
    'Ville : ' . $city,
    'Surface : ' . str_replace('.', ',', (string) $surface) . ' m²',
    'Projet : ' . $project,
    'Adresse IP : ' . $ip,
    'Navigateur : ' . $browser,
    'Statut : ' . $status,
    '',
    'Simulation arrêtée après l\'étape 1.',
    'Contact LL Carrelage : tel:+33618855886',
    'Appeler : tel:' . $safePhoneHref,
    '----------------------------------------',
]);

$htmlBody = '<h2>Nouveau prospect</h2>'
    . '<p><strong>Date :</strong> ' . htmlspecialchars($date, ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p><strong>Téléphone :</strong> <a href="tel:' . htmlspecialchars($safePhoneHref, ENT_QUOTES, 'UTF-8') . '">'
    . htmlspecialchars($phone, ENT_QUOTES, 'UTF-8') . '</a></p>'
    . '<p><strong>Ville :</strong> ' . htmlspecialchars($city, ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p><strong>Surface :</strong> ' . htmlspecialchars(str_replace('.', ',', (string) $surface), ENT_QUOTES, 'UTF-8') . ' m²</p>'
    . '<p><strong>Projet :</strong> ' . htmlspecialchars($project, ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p><strong>Adresse IP :</strong> ' . htmlspecialchars($ip, ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p><strong>Navigateur :</strong> ' . htmlspecialchars($browser, ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p><strong>Statut :</strong> ' . htmlspecialchars($status, ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p><strong>Contact LL Carrelage :</strong> <a href="tel:+33618855886">06 18 85 58 86</a></p>'
    . '<p>Simulation arrêtée après l&apos;étape 1.</p>';

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USERNAME;
    $mail->Password = SMTP_PASSWORD;
    $mail->Port = (int) SMTP_PORT;

    if (SMTP_ENCRYPTION === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } elseif (SMTP_ENCRYPTION === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    }

    $mail->CharSet = 'UTF-8';
    $mail->setFrom(SMTP_USERNAME, 'LL Carrelage');
    $mail->addAddress(EMAIL_DESTINATION);
    $mail->addReplyTo(EMAIL_DESTINATION, 'LL Carrelage');
    $mail->Subject = $subject;
    $mail->isHTML(true);
    $mail->Body = $htmlBody;
    $mail->AltBody = $plainBody;
    $mail->send();

    jsonResponse(200, ['success' => true]);
} catch (Exception $exception) {
    jsonResponse(500, ['success' => false]);
}
