import { ChangeEvent, Dispatch, SetStateAction, useCallback, useState } from 'react';

type Handler = (e: ChangeEvent<HTMLInputElement>) => void;
type ReturnTypes<T = any> = [T, Handler, Dispatch<SetStateAction<T>>];

const useInput = <T>(initialValue: T): ReturnTypes<T> => {
  const [value, setValue] = useState(initialValue);
  const handler = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value as unknown as T);
  }, []);
  return [value, handler, setValue];
};

export default useInput;

/* as unknown as T
https://stackoverflow.com/questions/69399211/typescript-why-does-as-unknown-as-x-work

data as Item will only work if data can be assigned to Item OR Item can be assigned to data. Since this is not true data as Item is an error.

data as unknown works because anything can be assigned to unknown and therefore data can be assigned to unknown. => 1

unknown as Item works because again anything can be assigned to unknown and therefore Item can be assigned to unknown. => 2

data as unknown as Item works because 1 && 2 are allowed.
*/
