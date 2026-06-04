/// Ensures story/media URLs load correctly in CachedNetworkImage.
String normalizeMediaUrl(String? url) {
  if (url == null || url.isEmpty) return '';
  final trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) return 'https:$trimmed';
  return trimmed;
}
