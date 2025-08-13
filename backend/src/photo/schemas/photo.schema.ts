import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PhotoDocument = Photo & Document;

@Schema({ timestamps: true })
export class Photo {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Mission', required: true })
  missionId: Types.ObjectId;

  // S3 object key (e.g., users/<uid>/YYYY/MM/DD/uuid.jpg)
  @Prop({ required: true })
  objectKey: string;

  @Prop()
  comment: string;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ default: false })
  isShared: boolean;

  @Prop()
  fileSize: number; // bytes

  @Prop()
  mimeType: string;

  @Prop()
  width?: number;

  @Prop()
  height?: number;
}

export const PhotoSchema = SchemaFactory.createForClass(Photo);
// 사용자+미션(=하루)당 한 장 고유 보장
PhotoSchema.index({ userId: 1, missionId: 1 }, { unique: true });
