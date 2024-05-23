import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { MdFileUpload } from "react-icons/md";
import "./styles.css";

// Define the initial state for the AudioToText block
const initialState = "idle";

// The AudioToText block.
export const AudioToText = createReactBlockSpec(
  {
    type: "audioToText",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      state: { default: initialState }, // Add the state property here
    },
    content: "inline",
  },
  {
    render: (props) => {
      return (
        <div className={"audio"} data-audio-state={props.block.props.state}>
          {/*Icon which opens a file upload dialog*/}
          <div className={"audio-icon-wrapper"} contentEditable={false}>
            <MdFileUpload
              className={"audio-icon"}
              size={32}
              onClick={() => {
                // TODO: Implement file upload functionality
                // TODO: Send audio file to OpenAI API for transcription
                // TODO: Insert transcribed text into editor
              }}
            />
          </div>
          {/*Rich text field for transcribed text to appear in*/}
          <div className={"inline-content"} ref={props.contentRef} />
        </div>
      );
    },
  }
);