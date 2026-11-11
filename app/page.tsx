import { SmoothScroll } from "@/components/SmoothScroll";
import { Hud } from "@/components/Hud";
import { Story } from "@/components/Story";
import { RadioDock } from "@/components/Radio";
import { ChillRoom } from "@/components/ChillRoom";
import { Preloader } from "@/components/Preloader";

export default function Home() {
  return (
    <>
      <Preloader />
      <SmoothScroll />
      <Hud />
      <Story />
      <RadioDock />
      <ChillRoom />
    </>
  );
}
