import assert from "node:assert/strict";
import { test } from "node:test";

type ContextState = "running" | "suspended" | "interrupted" | "closed";
type AudioModule = typeof import("../src/utils/audio");

// Fake only the Web Audio output boundary. No speakers, notification APIs or UI.
// A suspended clock preserves scheduled sources until resume succeeds, as Web Audio does.
class SilentContext {
  state: ContextState;
  currentTime = 0;
  sampleRate = 44100;
  destination = {};
  sources: { started: boolean; stopped: boolean }[] = [];
  deniedResume?: Error;

  constructor(state: ContextState) {
    this.state = state;
  }
  resume() {
    if (this.deniedResume) {
      const rejected = Promise.reject(this.deniedResume);
      // Observe the boundary's rejection without making node:test itself leak an
      // unhandled rejection. The application must still report failure to its caller.
      void rejected.catch(() => {});
      return rejected;
    }
    return Promise.resolve().then(() => {
      this.state = "running";
    });
  }
  close() {
    this.state = "closed";
    return Promise.resolve();
  }
  createBuffer(_channels: number, length: number) {
    const samples = new Float32Array(length);
    return { getChannelData: () => samples };
  }
  createBufferSource() {
    const state = { started: false, stopped: false };
    this.sources.push(state);
    return {
      buffer: undefined,
      connect: () => {},
      start: () => { state.started = true; },
      stop: () => { state.stopped = true; },
    };
  }
  createGain() {
    const parameter = {
      value: 1,
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {},
    };
    return { gain: parameter, connect: () => {} };
  }
  get activeSources() {
    return this.state === "running"
      ? this.sources.filter((source) => source.started && !source.stopped).length
      : 0;
  }
}

let caseNumber = 0;
async function withSilentAudio(
  initialState: ContextState,
  run: (audio: AudioModule, contexts: SilentContext[]) => Promise<void>,
  deniedResume?: Error,
) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const contexts: SilentContext[] = [];
  class TestContext extends SilentContext {
    constructor() {
      super(initialState);
      this.deniedResume = deniedResume;
      contexts.push(this);
    }
  }
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { AudioContext: TestContext },
  });
  const moduleURL = new URL("../src/utils/audio.ts", import.meta.url);
  moduleURL.searchParams.set("preview-test", String(++caseNumber));
  const audio = await import(moduleURL.href) as AudioModule;
  try {
    await run(audio, contexts);
  } finally {
    audio.stopCurrentSound();
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

test("preview recovers when a previously working context was interrupted", async () => {
  await withSilentAudio("running", async (audio, contexts) => {
    await audio.playReminderSound("ceramic", "soft");
    assert.ok(contexts.some((context) => context.activeSources > 0));

    contexts[0].state = "interrupted";
    await audio.playReminderSound("ceramic", "soft");
    assert.ok(
      contexts.some((context) => context.activeSources > 0),
      "the second preview must restore output after an audio-session interruption",
    );
  });
});

test("an asynchronously resumed suspended clock preserves the scheduled preview", async () => {
  await withSilentAudio("suspended", async (audio, contexts) => {
    await audio.playReminderSound("ceramic", "soft");
    assert.ok(contexts.some((context) => context.activeSources > 0));
  });
});

test("a denied resume is reported as failure to the preview caller", async () => {
  await withSilentAudio("suspended", async (audio, contexts) => {
    let result: unknown;
    let reportedError: unknown;
    try {
      result = await audio.playReminderSound("ceramic", "soft");
    } catch (error) {
      reportedError = error;
    }
    assert.equal(contexts.reduce((sum, context) => sum + context.activeSources, 0), 0);
    assert.ok(
      reportedError instanceof Error || result === false,
      "a rejected resume must be observable as failure, so the UI cannot claim playback",
    );
  }, new Error("NotAllowedError: resume denied"));
});

test("an interrupted session that never resumes cannot leave preview waiting forever", async () => {
  await withSilentAudio("suspended", async (audio, contexts) => {
    const original = SilentContext.prototype.resume;
    SilentContext.prototype.resume = function () { return new Promise<void>(() => {}); };
    try {
      await assert.rejects(audio.playReminderSound("ceramic", "soft"), /音频.*恢复/);
      assert.equal(contexts.reduce((sum, context) => sum + context.activeSources, 0), 0);
    } finally { SilentContext.prototype.resume = original; }
  });
});
