// Stub for @opentelemetry/api to prevent it from being imported in Edge environments
// where the dependency cannot be resolved or is not needed.

class NoopTracer {
  startSpan() {
    return new NoopSpan();
  }
  startActiveSpan(name: string, arg2: any, arg3?: any, arg4?: any) {
    const callback = typeof arg2 === 'function' ? arg2 : typeof arg3 === 'function' ? arg3 : arg4;
    if (typeof callback === 'function') {
      return callback(new NoopSpan());
    }
    return new NoopSpan();
  }
}

class NoopSpan {
  end() {}
  setAttribute() {
    return this;
  }
  setAttributes() {
    return this;
  }
  recordException() {}
  setStatus() {
    return this;
  }
  updateName() {
    return this;
  }
  isRecording() {
    return false;
  }
  spanContext() {
    return {};
  }
}

class NoopTracerProvider {
  getTracer() {
    return new NoopTracer();
  }
}

export const trace = {
  getTracer: () => new NoopTracer(),
  getTracerProvider: () => new NoopTracerProvider(),
  getActiveSpan: () => undefined,
};

export const context = {
  active: () => ({}),
  with: (ctx: any, fn: any) => fn(),
  bind: (ctx: any, fn: any) => fn,
};

export const propagation = {
  inject: () => {},
  extract: () => ({}),
  fields: () => [],
};

export const diag = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

export const metrics = {
  getMeter: () => ({
    createCounter: () => ({ add: () => {} }),
    createUpDownCounter: () => ({ add: () => {} }),
    createHistogram: () => ({ record: () => {} }),
    createGauge: () => ({ record: () => {} }),
  }),
};

export const baggageEntryMetadataFromString = () => ({});
export const createContextKey = () => ({});
export const ROOT_CONTEXT = {};
export const DiagConsoleLogger = class {};
export const DiagLogLevel = {};
export const createNoopMeter = () => ({});
export const ValueType = {};
export const defaultTextMapGetter = {};
export const defaultTextMapSetter = {};
export const ProxyTracer = NoopTracer;
export const ProxyTracerProvider = NoopTracerProvider;
export const SamplingDecision = {};
export const SpanKind = {};
export const SpanStatusCode = {};
export const TraceFlags = {};
export const createTraceState = () => ({});
export const isSpanContextValid = () => false;
export const isValidTraceId = () => false;
export const isValidSpanId = () => false;
export const INVALID_SPANID = '';
export const INVALID_TRACEID = '';
export const INVALID_SPAN_CONTEXT = {};

const _default = {
  trace,
  context,
  propagation,
  diag,
  metrics,
};

export default _default;
