import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  kakaoId: string;

  @Prop({ required: true })
  nickname: string;

  @Prop()
  name?: string;

  @Prop()
  profileImage: string;

  @Prop()
  email: string;

  @Prop({ default: Date.now })
  lastLoginAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  refreshTokenHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
