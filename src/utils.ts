const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function utf8Encode(value: string) {
  return encodeURIComponent(value).replace(
    /%([0-9A-F]{2})/g,
    (_, hex) => String.fromCharCode(parseInt(hex, 16))
  );
}

export function base64Encode(value: string) {
  const bytes = utf8Encode(value);
  let output = "";

  for (let i = 0; i < bytes.length; i += 3) {
    const first = bytes.charCodeAt(i);
    const second = bytes.charCodeAt(i + 1);
    const third = bytes.charCodeAt(i + 2);

    output += BASE64_CHARS[first >> 2];
    output += BASE64_CHARS[((first & 3) << 4) | (second >> 4)];
    output +=
      i + 1 < bytes.length
        ? BASE64_CHARS[((second & 15) << 2) | (third >> 6)]
        : "=";
    output += i + 2 < bytes.length ? BASE64_CHARS[third & 63] : "=";
  }

  return output;
}
