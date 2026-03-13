/**
 * SVG 기반 범용 라인 차트
 * 의존성: react-native, react-native-svg
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface LineChartDataPoint {
    label: string;
    value: number;
}

export interface SVGLineChartColors {
    line?: string;
    fill?: string;
    point?: string;
    axis?: string;
    tooltip?: string;
    tooltipText?: string;
    labelText?: string;
    loadingText?: string;
}

export interface SVGLineChartProps {
    data: LineChartDataPoint[];
    width: number;
    height: number;
    colors?: SVGLineChartColors;
    maxValue?: number;
    showArea?: boolean;
    showDataPoints?: boolean;
    showLabels?: boolean;
    unit?: string;
    onPointPress?: (point: LineChartDataPoint, index: number) => void;
}

const DEFAULT_COLORS: SVGLineChartColors = {
    line: '#6B8E8E',
    fill: '#6B8E8E',
    point: '#6B8E8E',
    axis: '#E5E5E5',
    tooltip: '#6B8E8E',
    tooltipText: '#FFFFFF',
    labelText: '#999999',
    loadingText: '#999999',
};

const SVGLineChartComponent = ({
    data,
    width,
    height,
    colors: colorsProp,
    maxValue,
    showArea = true,
    showDataPoints = true,
    showLabels = true,
    unit = '',
    onPointPress,
}: SVGLineChartProps) => {
    const c = { ...DEFAULT_COLORS, ...colorsProp };
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const chartPadding = { top: 40, right: 10, bottom: 30, left: 10 };
    const chartWidth = width - chartPadding.left - chartPadding.right;
    const chartHeight = height - chartPadding.top - chartPadding.bottom;

    const computedMaxValue = useMemo(() => {
        if (maxValue) return maxValue;
        const max = Math.max(...data.map(d => d.value));
        return max > 0 ? max * 1.2 : 100;
    }, [data, maxValue]);

    const points = useMemo(() => {
        if (data.length === 0) return [];

        const spacing = chartWidth / Math.max(data.length - 1, 1);

        return data.map((d, i) => ({
            x: chartPadding.left + (data.length === 1 ? chartWidth / 2 : i * spacing),
            y: chartPadding.top + chartHeight - (d.value / computedMaxValue) * chartHeight,
            ...d,
        }));
    }, [data, chartWidth, chartHeight, computedMaxValue]);

    const linePath = useMemo(() => {
        if (points.length === 0) return '';

        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`;
        }

        return path;
    }, [points]);

    const areaPath = useMemo(() => {
        if (points.length === 0) return '';

        const bottomY = chartPadding.top + chartHeight;
        let path = `M ${points[0].x} ${bottomY}`;

        path += ` L ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`;
        }

        path += ` L ${points[points.length - 1].x} ${bottomY}`;
        path += ' Z';

        return path;
    }, [points, chartHeight]);

    const handlePointPress = (index: number) => {
        setSelectedIndex(selectedIndex === index ? null : index);
        if (onPointPress && data[index]) {
            onPointPress(data[index], index);
        }
    };

    if (data.length === 0) {
        return (
            <View style={[styles.loadingContainer, { width, height }]}>
                <Text style={[styles.loadingText, { color: c.loadingText }]}>차트 로딩중...</Text>
            </View>
        );
    }

    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <View style={[styles.container, { width, height }]}>
            <Svg width={width} height={height}>
                <Defs>
                    <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={c.fill} stopOpacity="0.4" />
                        <Stop offset="1" stopColor={c.fill} stopOpacity="0.05" />
                    </LinearGradient>
                </Defs>

                {/* X축 라인 */}
                <Line
                    x1={chartPadding.left}
                    y1={chartPadding.top + chartHeight}
                    x2={width - chartPadding.right}
                    y2={chartPadding.top + chartHeight}
                    stroke={c.axis}
                    strokeWidth={1}
                />

                {/* 영역 채우기 */}
                {showArea && areaPath && (
                    <Path
                        d={areaPath}
                        fill={`url(#${gradientId})`}
                    />
                )}

                {/* 라인 */}
                {linePath && (
                    <Path
                        d={linePath}
                        stroke={c.line}
                        strokeWidth={3}
                        fill="none"
                    />
                )}

                {/* 데이터 포인트 */}
                {showDataPoints && points.map((point, index) => (
                    <Circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r={selectedIndex === index ? 6 : 4}
                        fill={c.point}
                    />
                ))}
            </Svg>

            {/* 터치 영역 및 툴팁 */}
            {points.map((point, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.touchArea,
                        {
                            left: point.x - 20,
                            top: point.y - 20,
                        }
                    ]}
                    onPress={() => handlePointPress(index)}
                    activeOpacity={0.7}
                >
                    {selectedIndex === index && (
                        <View style={[
                            styles.tooltip,
                            { backgroundColor: c.tooltip },
                            index === 0 && styles.tooltipLeft,
                            index === points.length - 1 && styles.tooltipRight,
                        ]}>
                            <Text style={[styles.tooltipText, { color: c.tooltipText }]}>
                                {point.value}{unit}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            ))}

            {/* X축 라벨 */}
            {showLabels && (
                <View style={[styles.labelContainer, { top: chartPadding.top + chartHeight + 5 }]}>
                    {data.map((d, index) => (
                        <Text
                            key={index}
                            style={[
                                styles.labelText,
                                {
                                    position: 'absolute',
                                    left: points[index]?.x - 15 || 0,
                                    color: c.labelText,
                                }
                            ]}
                        >
                            {d.label}
                        </Text>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 13,
    },
    touchArea: {
        position: 'absolute',
        width: 40,
        height: 40,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    tooltip: {
        position: 'absolute',
        top: -30,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        minWidth: 50,
    },
    tooltipLeft: {
        left: 0,
    },
    tooltipRight: {
        right: 0,
    },
    tooltipText: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
    },
    labelContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 20,
    },
    labelText: {
        fontSize: 11,
        width: 30,
        textAlign: 'center',
    },
});

export const SVGLineChart = React.memo(
    SVGLineChartComponent,
    (prevProps, nextProps) => {
        return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
            && prevProps.width === nextProps.width
            && prevProps.height === nextProps.height
            && prevProps.maxValue === nextProps.maxValue;
    }
);
