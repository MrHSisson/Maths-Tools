import { SpecLanding } from "../../shared/components/SpecLanding";
import { CHAPTERS, GENERAL_RESOURCES, CHECK_NOTES } from "./mechanicsSpec";

// Further Mechanics: the landing page for the AQA 7367 mechanics option (MA–ME). The look and behaviour are the shared
// SpecLanding page; this file supplies the words. Developing-tools only (registry `enabled: false`, and the page asks for the password).

export default function FurtherMechanics() {
  return (
    <SpecLanding
      title="Further Mechanics"
      subtitle="AQA A-level Further Mathematics"
      about="The mechanics option of AQA 7367 (sections MA to ME), planned chapter by chapter. Each chapter lists the specification statements, which are in AS and which are A2 only, and the older AQA papers they draw on. No question tools are built yet."
      chapters={CHAPTERS}
      generalResources={GENERAL_RESOURCES}
      papers={{ heading: "Older papers and question banks", intro: "The legacy AQA mechanics papers have a much deeper bank than the current spec.", cardText: "AQA M1–M3 papers and the checked legacy map" }}
      check={CHECK_NOTES}
    />
  );
}
