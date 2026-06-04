const originalWarn = console.warn.bind(console);
const baselineWarning =
  '[baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data';

console.warn = (...args) => {
  const message = args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message;
      return '';
    })
    .join(' ');

  if (message.includes(baselineWarning)) return;

  originalWarn(...args);
};
