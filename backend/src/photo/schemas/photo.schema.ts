import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PhotoDocument = Photo & Document;

@Schema({ timestamps: true })
export class Photo {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Mission', required: true })
  missionId: Types.ObjectId;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  fileName: string;

  @Prop()
  comment: string;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ default: false })
  isShared: boolean;

  @Prop()
  fileSize: number;

  @Prop()
  mimeType: string;
}

export const PhotoSchema = SchemaFactory.createForClass(Photo);
