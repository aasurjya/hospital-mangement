import { generateCsv } from '../csv'

describe('generateCsv', () => {
  it('generates headers and rows', () => {
    const rows = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]
    const csv = generateCsv(rows, [
      { key: 'name', header: 'Name' },
      { key: 'age', header: 'Age' },
    ])
    expect(csv).toBe('Name,Age\nAlice,30\nBob,25')
  })

  it('returns only headers for empty rows', () => {
    const csv = generateCsv([], [
      { key: 'name' as never, header: 'Name' },
    ])
    expect(csv).toBe('Name')
  })

  it('handles null and undefined values', () => {
    const rows = [{ a: null, b: undefined, c: 'ok' }]
    const csv = generateCsv(rows as Record<string, unknown>[], [
      { key: 'a', header: 'A' },
      { key: 'b', header: 'B' },
      { key: 'c', header: 'C' },
    ])
    expect(csv).toBe('A,B,C\n,,ok')
  })

  it('escapes fields with commas', () => {
    const rows = [{ text: 'hello, world' }]
    const csv = generateCsv(rows, [
      { key: 'text', header: 'Text' },
    ])
    expect(csv).toBe('Text\n"hello, world"')
  })

  it('escapes fields with double quotes', () => {
    const rows = [{ text: 'say "hi"' }]
    const csv = generateCsv(rows, [
      { key: 'text', header: 'Text' },
    ])
    expect(csv).toBe('Text\n"say ""hi"""')
  })

  it('escapes fields with newlines', () => {
    const rows = [{ text: 'line1\nline2' }]
    const csv = generateCsv(rows, [
      { key: 'text', header: 'Text' },
    ])
    expect(csv).toBe('Text\n"line1\nline2"')
  })

  it('prevents formula injection with = prefix', () => {
    const rows = [{ val: '=SUM(A1)' }]
    const csv = generateCsv(rows, [
      { key: 'val', header: 'Value' },
    ])
    expect(csv).toContain("\"'=SUM(A1)\"")
  })

  it('prevents formula injection with + prefix', () => {
    const rows = [{ val: '+cmd' }]
    const csv = generateCsv(rows, [
      { key: 'val', header: 'Value' },
    ])
    expect(csv).toContain("\"'+cmd\"")
  })

  it('prevents formula injection with - prefix', () => {
    const rows = [{ val: '-cmd' }]
    const csv = generateCsv(rows, [
      { key: 'val', header: 'Value' },
    ])
    expect(csv).toContain("\"'-cmd\"")
  })

  it('prevents formula injection with @ prefix', () => {
    const rows = [{ val: '@SUM(A1)' }]
    const csv = generateCsv(rows, [
      { key: 'val', header: 'Value' },
    ])
    expect(csv).toContain("\"'@SUM(A1)\"")
  })

  it('respects column ordering', () => {
    const rows = [{ z: 3, a: 1, m: 2 }]
    const csv = generateCsv(rows, [
      { key: 'm', header: 'Middle' },
      { key: 'a', header: 'First' },
      { key: 'z', header: 'Last' },
    ])
    expect(csv).toBe('Middle,First,Last\n2,1,3')
  })
})
