export type ActionSuccess<T> = {
  ok: true;
  data: T;
};

export type ActionFailure = {
  ok: false;
  error: string;
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;
