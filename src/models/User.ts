import { Table, Column, Model, CreatedAt, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table
export class User extends Model<User> { 
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column first_name: string;

  @Column last_name: string;

  @Column username: string;

  @Column auth_token: string;

  @Column refresh_token: string;

  @Column password: string;

  @CreatedAt createdAt: Date;
}
