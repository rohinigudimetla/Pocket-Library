import { useState } from "react";
function useCounter(initialValue: number) {
	const [count, setCount] = useState(initialValue);

	function increment() {
		setCount((c) => c + 1);
	}

	function decrement() {
		setCount((c) => c - 1);
	}

	function reset() {
		setCount(0);
	}

	return { count, increment, decrement, reset };
}

export default useCounter;
