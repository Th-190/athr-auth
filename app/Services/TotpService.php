<?php

namespace App\Services;

class TotpService
{
    private const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public function generateSecret(): string
    {
        $bits = '';
        foreach (str_split(random_bytes(20)) as $char) {
            $bits .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
        }
        $encoded = '';
        foreach (str_split($bits, 5) as $chunk) {
            $encoded .= self::BASE32[bindec($chunk)];
        }
        return $encoded;
    }

    public function verify(string $secret, string $code, ?int $timestamp = null): bool
    {
        if (!preg_match('/^\d{6}$/', $code)) return false;
        $bits = '';
        foreach (str_split(strtoupper(rtrim($secret, '='))) as $char) {
            $index = strpos(self::BASE32, $char);
            if ($index === false) return false;
            $bits .= str_pad(decbin($index), 5, '0', STR_PAD_LEFT);
        }
        $key = '';
        foreach (str_split($bits, 8) as $byte) if (strlen($byte) === 8) $key .= chr(bindec($byte));
        $counter = intdiv($timestamp ?? time(), 30);
        for ($offset = -1; $offset <= 1; $offset++) {
            $step = $counter + $offset;
            $hash = hash_hmac('sha1', pack('N2', intdiv($step, 0x100000000), $step % 0x100000000), $key, true);
            $position = ord($hash[19]) & 0x0f;
            $value = ((ord($hash[$position]) & 0x7f) << 24) | ((ord($hash[$position + 1]) & 0xff) << 16) | ((ord($hash[$position + 2]) & 0xff) << 8) | (ord($hash[$position + 3]) & 0xff);
            if (hash_equals(str_pad((string) ($value % 1_000_000), 6, '0', STR_PAD_LEFT), $code)) return true;
        }
        return false;
    }
}
