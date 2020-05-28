import {
  Publisher,
  ExpirationCompleteEvent,
  Subjects
} from '@lrtickets/common';

export class ExpirationCompletePublisher extends Publisher<
  ExpirationCompleteEvent
> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
