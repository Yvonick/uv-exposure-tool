// Minimal read-only CDF-1/2 header reader for KNMI's MSR2 archive.
// Format: https://docs.unidata.ucar.edu/netcdf-c/current/file_format_specifications.html
import assert from 'node:assert/strict';

const sizes = [0, 1, 1, 2, 4, 4, 8];
export function values(buffer, type, count, offset = 0) {
  if (type === 2) return buffer.toString('utf8', offset, offset + count);
  const readers = { 1: 'readInt8', 3: 'readInt16BE', 4: 'readInt32BE', 5: 'readFloatBE', 6: 'readDoubleBE' };
  assert.ok(readers[type], `Unsupported NetCDF type ${type}`);
  return Array.from({ length: count }, (_, i) => buffer[readers[type]](offset + i * sizes[type]));
}

export function readHeader(buffer) {
  assert.equal(buffer.toString('ascii', 0, 3), 'CDF');
  const version = buffer[3];
  assert.ok(version === 1 || version === 2);
  let position = 4;
  const uint = () => { const value = buffer.readUInt32BE(position); position += 4; return value; };
  const string = () => { const length = uint(); const text = buffer.toString('utf8', position, position + length); position += Math.ceil(length / 4) * 4; return text; };
  function list(tag, read) {
    const actual = uint(), count = uint();
    assert.ok(actual === tag || (actual === 0 && count === 0));
    return Array.from({ length: count }, read);
  }
  const attributes = () => Object.fromEntries(list(12, () => {
    const name = string(), type = uint(), count = uint();
    const result = values(buffer, type, count, position);
    position += Math.ceil(count * sizes[type] / 4) * 4;
    return [name, typeof result === 'string' ? result : count === 1 ? result[0] : result];
  }));
  const records = uint();
  const dimensions = list(10, () => ({ name: string(), length: uint() }));
  const globals = attributes();
  const variables = list(11, () => {
    const name = string(), rank = uint();
    const dimensions = Array.from({ length: rank }, uint);
    const attrs = attributes(), type = uint(), size = uint();
    const begin = version === 2 ? Number(buffer.readBigUInt64BE(position)) : buffer.readUInt32BE(position);
    position += version === 2 ? 8 : 4;
    return { name, dimensions, attrs, type, size, begin };
  });
  const recordVariables = variables.filter(v => dimensions[v.dimensions[0]]?.length === 0);
  const recordSize = recordVariables.reduce((sum, v) => sum + v.size, 0);
  return { records, dimensions, globals, variables, recordSize, headerBytes: position };
}
