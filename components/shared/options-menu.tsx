import React from 'react';

function OptionsMenu() {
  return (
    <div className="options-menu">
      <button onClick={() => alert('Option 1 selected')}>Option 1</button>
      <button onClick={() => alert('Option 2 selected')}>Option 2</button>
      <button onClick={() => alert('Option 3 selected')}>Option 3</button>
    </div>
  );
}

export default OptionsMenu;
