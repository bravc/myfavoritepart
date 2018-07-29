import { Table, Column, Model, CreatedAt, PrimaryKey, AutoIncrement, IsUUID } from 'sequelize-typescript';

@Table
export class User extends Model<User> {

  @Column first_name: string;

  @Column last_name: string;

  @Column username: string;

  @Column auth_token: string;

  @Column refresh_token: string;

  @Column spotify_id: number;

  @Column password: string;

  @CreatedAt createdAt: Date;
}
