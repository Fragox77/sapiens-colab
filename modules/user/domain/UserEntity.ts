import { User } from "@sapiens/types";

export class UserEntity {
  constructor(private readonly data: User) {}

  toJSON(): User {
    return this.data;
  }
}