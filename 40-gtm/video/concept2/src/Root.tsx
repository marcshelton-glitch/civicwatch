import { Composition } from "remotion";
import { Concept2 } from "./Concept2";
import { Concept1 } from "./Concept1";
import { Concept3 } from "./Concept3";
import { Concept4 } from "./Concept4";
export const Root = () => (
  <>
    <Composition id="Concept2" component={Concept2} durationInFrames={300} fps={30} width={1920} height={1080} />
    <Composition id="Concept1" component={Concept1} durationInFrames={300} fps={30} width={1080} height={1920} />
    <Composition id="Concept3" component={Concept3} durationInFrames={300} fps={30} width={1080} height={1920} />
    <Composition id="Concept4" component={Concept4} durationInFrames={540} fps={30} width={1080} height={1920} />
    <Composition id="Concept4Wide" component={Concept4} durationInFrames={540} fps={30} width={1920} height={1080} />
  </>
);
