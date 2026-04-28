import { useState } from "react";

function useToggle(initialValue: boolean) {
	const [value, setValue] = useState(initialValue);
	//  functional update form of setState.
	// safer because it always uses the latest value, not a potentially stale one from closure
	return { value, toggle: () => setValue((value) => !value) };
}

export default useToggle;
